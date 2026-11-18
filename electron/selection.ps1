# Read the foreground application's selection through Windows UI Automation.
# Do not send keys, read the clipboard, or record surrounding text.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $element = [System.Windows.Automation.AutomationElement]::FocusedElement
    $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
    for ($depth = 0; $depth -lt 6 -and $null -ne $element; $depth++) {
        $pattern = $null
        if ($element.TryGetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern, [ref]$pattern)) {
            foreach ($range in $pattern.GetSelection()) {
                $selected = $range.GetText(81)
                if (-not [string]::IsNullOrWhiteSpace($selected)) {
                    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
                    [Console]::Write($selected)
                    exit 0
                }
            }
        }
        $element = $walker.GetParent($element)
    }
} catch {
    # Unsupported controls are an expected compatibility limitation.
}
exit 0
