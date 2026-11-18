using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Speech.Synthesis;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Automation.Text;

// Trusted, bounded native selection bridge. Never reads or changes the clipboard.
public static class SelectionHost {
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
    [DllImport("user32.dll")] static extern bool GetCursorPos(out PointNative point);
    [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr context);
    [StructLayout(LayoutKind.Sequential)] struct PointNative { public int X; public int Y; }
    public class Command { public string action; public string id; public int ownerPid; public bool automatic; public string word; }
    public class Selection { public string text; public long hwnd; public double x; public double y; public double width; public double height; }
    static readonly ConcurrentQueue<Command> commands = new ConcurrentQueue<Command>();
    static readonly AutoResetEvent signal = new AutoResetEvent(false);
    static readonly JavaScriptSerializer json = new JavaScriptSerializer();
    static readonly object outputLock = new object();
    static volatile bool running = true;
    static volatile bool automatic;
    static int ownerPid;
    static SpeechSynthesizer voice;
    static long dueTicks = Int64.MaxValue;
    static AutomationElement eventRoot; static IntPtr hookedWindow;
    static AutomationEventHandler selectionEvent = (sender,args) => { if(automatic && GetForegroundWindow()==hookedWindow) Interlocked.Exchange(ref dueTicks,DateTime.UtcNow.AddMilliseconds(300).Ticks); };
    static DateTime suppressUntil = DateTime.MinValue;
    static string lastAutomatic = "";

    static void Emit(object value) { lock(outputLock) { Console.WriteLine(json.Serialize(value)); Console.Out.Flush(); } }
    static bool ExternalWindow(IntPtr hwnd) {
        if(hwnd == IntPtr.Zero) return false;
        uint pid; GetWindowThreadProcessId(hwnd, out pid);
        return pid != ownerPid && pid != Process.GetCurrentProcess().Id;
    }
    static bool Within(AutomationElement element, AutomationElement root) {
        for(int i=0; i<25 && element != null; i++) {
            if(element.Equals(root)) return true;
            element = TreeWalker.ControlViewWalker.GetParent(element);
        }
        return false;
    }
    static Selection Read(AutomationElement element, IntPtr hwnd) {
        if(element == null || element.Current.IsOffscreen || element.Current.IsPassword) return null;
        object pattern;
        if(!element.TryGetCurrentPattern(TextPattern.Pattern, out pattern)) return null;
        foreach(var range in ((TextPattern)pattern).GetSelection()) {
            if(range.CompareEndpoints(TextPatternRangeEndpoint.Start, range, TextPatternRangeEndpoint.End) == 0) continue;
            string text = range.GetText(81);
            if(String.IsNullOrWhiteSpace(text) || text.Length > 80) continue;
            text = Regex.Replace(text.Trim(), @"\s+", " ");
            if(!Regex.IsMatch(text, @"^[\p{L}\p{M} '\u2019-]+$")) continue;
            var result = new Selection { text = text, hwnd = hwnd.ToInt64() };
            Rect[] rectangles = range.GetBoundingRectangles();
            Rect bounds=Rect.Empty;foreach(Rect rectangle in rectangles)if(!rectangle.IsEmpty)bounds.Union(rectangle);
            if(!bounds.IsEmpty){result.x=bounds.X;result.y=bounds.Y;result.width=bounds.Width;result.height=bounds.Height;}
            return result;
        }
        return null;
    }
    static Selection Ancestors(AutomationElement element, AutomationElement root, IntPtr hwnd) {
        if(element == null || !Within(element,root)) return null;
        for(int i=0; i<25 && element != null; i++) {
            Selection found = Read(element,hwnd);
            if(found != null) return found;
            if(element.Equals(root)) break;
            element=TreeWalker.ControlViewWalker.GetParent(element);
        }
        return null;
    }
    static Selection Capture() {
        IntPtr hwnd=GetForegroundWindow();
        if(!ExternalWindow(hwnd)) return null;
        try {
            AutomationElement focused=AutomationElement.FocusedElement;
            if(focused!=null && focused.Current.IsPassword)return null;
            AutomationElement root=AutomationElement.FromHandle(hwnd);
            Selection found=null;
            PointNative point;
            // The selected text in Chromium may not be on the keyboard-focus chain.
            if(GetCursorPos(out point)) found=Ancestors(AutomationElement.FromPoint(new Point(point.X,point.Y)),root,hwnd);
            if(found == null) found=Ancestors(AutomationElement.FocusedElement,root,hwnd);
            if(found == null) {
                var document=root.FindFirst(TreeScope.Descendants,new AndCondition(new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Document),new PropertyCondition(AutomationElement.IsOffscreenProperty,false)));
                found=Read(document,hwnd);
            }
            if(found == null) {
                var queue=new Queue<AutomationElement>(); queue.Enqueue(root);
                for(int visited=0; queue.Count>0 && visited<160; visited++) {
                    var element=queue.Dequeue();
                    found=Read(element,hwnd); if(found != null) break;
                    var child=TreeWalker.ControlViewWalker.GetFirstChild(element);
                    for(int count=0; child != null && count<32 && queue.Count<160; count++) { queue.Enqueue(child); child=TreeWalker.ControlViewWalker.GetNextSibling(child); }
                }
            }
            return GetForegroundWindow()==hwnd ? found : null;
        } catch { return null; }
    }
    static string Signature(Selection selection) { return selection == null ? "" : selection.hwnd+"|"+selection.text; }
    static void Lookup(string id, bool passive) {
        Emit(new { type="busy", id=id });
        var selection=Capture();
        if(!passive) {
            suppressUntil=DateTime.UtcNow.AddMilliseconds(500);
            lastAutomatic=Signature(selection);
            Emit(new { type="capture", id=id, selection=selection });
        } else {
            string signature=Signature(selection);
            if(signature != lastAutomatic) { lastAutomatic=signature; Emit(new { type=selection==null?"clear":"selection", selection=selection }); }
            Emit(new { type="idle" });
        }
    }
    static void UpdateSubscription() {
        IntPtr hwnd=automatic?GetForegroundWindow():IntPtr.Zero;
        if(hwnd==hookedWindow)return;
        Emit(new {type="busy",id="subscribe"});
        try { if(eventRoot!=null)Automation.RemoveAutomationEventHandler(TextPattern.TextSelectionChangedEvent,eventRoot,selectionEvent); }catch{}
        eventRoot=null;hookedWindow=hwnd;lastAutomatic="";Emit(new {type="clear"});
        if(ExternalWindow(hwnd))try{eventRoot=AutomationElement.FromHandle(hwnd);Automation.AddAutomationEventHandler(TextPattern.TextSelectionChangedEvent,eventRoot,TreeScope.Subtree,selectionEvent);}catch{eventRoot=null;}
        Emit(new {type="idle"});
    }
    static void Speak(Command command) {
        try {
            if(command.word == null || command.word.Length>80 || !Regex.IsMatch(command.word,@"^[\p{L}\p{M} '\u2019-]+$")) throw new Exception();
            if(voice==null) { voice=new SpeechSynthesizer(); foreach(var installed in voice.GetInstalledVoices()) if(installed.Enabled && installed.VoiceInfo.Culture.TwoLetterISOLanguageName=="en") {voice.SelectVoice(installed.VoiceInfo.Name);break;} voice.SetOutputToDefaultAudioDevice(); }
            voice.SpeakAsyncCancelAll(); voice.SpeakAsync(command.word);
            Emit(new { type="speech", id=command.id, ok=true });
        } catch { Emit(new { type="speech", id=command.id, ok=false }); }
    }
    [MTAThread] public static void Main() {
        Console.InputEncoding=new UTF8Encoding(false); Console.OutputEncoding=new UTF8Encoding(false);
        try { SetProcessDpiAwarenessContext(new IntPtr(-4)); } catch { }
        var input=new Thread(()=> { string line; while((line=Console.ReadLine())!=null) { try { if(line.Length<=4096) commands.Enqueue(new JavaScriptSerializer().Deserialize<Command>(line)); } catch { } signal.Set(); } running=false; signal.Set(); });
        input.IsBackground=true; input.Start();
        Emit(new {type="ready"});
        bool leftDown=false, shiftDown=false;
        while(running) {
            Command command;
            while(commands.TryDequeue(out command)) {
                if(command==null) continue;
                if(command.action=="configure") { ownerPid=command.ownerPid; automatic=command.automatic; Interlocked.Exchange(ref dueTicks,Int64.MaxValue); lastAutomatic=""; }
                else if(command.action=="capture") Lookup(command.id,false);
                else if(command.action=="speak") Speak(command);
                else if(command.action=="stop-speech" && voice!=null) voice.SpeakAsyncCancelAll();
                else if(command.action=="quit") running=false;
            }
            UpdateSubscription();
            if(automatic) {
                bool left=(GetAsyncKeyState(1)&0x8000)!=0, shift=(GetAsyncKeyState(16)&0x8000)!=0;
                if((leftDown&&!left)||(shiftDown&&!shift)) Interlocked.Exchange(ref dueTicks,DateTime.UtcNow.AddMilliseconds(300).Ticks);
                leftDown=left; shiftDown=shift;
                if(!left && !shift && DateTime.UtcNow.Ticks>=Interlocked.Read(ref dueTicks)) { Interlocked.Exchange(ref dueTicks,Int64.MaxValue); if(DateTime.UtcNow>=suppressUntil) Lookup("automatic",true); }
            }
            signal.WaitOne(35);
        }
        if(voice!=null) voice.Dispose();
    }
}
