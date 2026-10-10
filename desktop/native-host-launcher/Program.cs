using System.Diagnostics;
using System.Text.Json;
using Microsoft.Win32;

// Install beside JacksonChung.exe. Browser-provided arguments are never forwarded.
string root = AppContext.BaseDirectory;
string executable = Path.Combine(root, "JacksonChung.exe");
string script = Path.Combine(root, "resources", "app.asar.unpacked", "desktop", "native-host.cjs");
if (args.Length == 1 && (args[0] == "--register" || args[0] == "--unregister")) {
    const string host = "org.jacksonchung.companion";
    string[] browsers = { @"Software\Google\Chrome\NativeMessagingHosts\", @"Software\Microsoft\Edge\NativeMessagingHosts\", @"Software\Chromium\NativeMessagingHosts\" };
    string manifestPath = Path.Combine(root, "native-messaging-host.json");
    if (args[0] == "--unregister") {
        foreach (string browser in browsers) {
            using var key = Registry.CurrentUser.OpenSubKey(browser + host);
            if (string.Equals(key?.GetValue(null) as string, manifestPath, StringComparison.OrdinalIgnoreCase)) Registry.CurrentUser.DeleteSubKey(browser + host, false);
        }
        return 0;
    }
    using var config = JsonDocument.Parse(File.ReadAllText(Path.Combine(root, "native-host-config.json")));
    string? id = config.RootElement.GetProperty("extensionId").GetString();
    if (id != "nmehnkibdepbhmfggkofdpngpklinahg") return 5;
    string launcher = Path.Combine(root, "JacksonChungNativeHost.exe");
    if (!File.Exists(launcher) || !File.Exists(executable) || !File.Exists(script)) return 2;
    File.WriteAllText(manifestPath, JsonSerializer.Serialize(new { name = host, description = "Jackson Chung local companion", path = launcher, type = "stdio", allowed_origins = new[] { "chrome-extension://" + id + "/" } }));
    foreach (string browser in browsers) { using var key = Registry.CurrentUser.CreateSubKey(browser + host); key.SetValue(null, manifestPath, RegistryValueKind.String); }
    return 0;
}
if (!File.Exists(executable) || !File.Exists(script)) return 2;
var start = new ProcessStartInfo(executable) {
    UseShellExecute = false,
    CreateNoWindow = true,
    WindowStyle = ProcessWindowStyle.Hidden,
    RedirectStandardInput = true,
    RedirectStandardOutput = true,
    RedirectStandardError = true,
    WorkingDirectory = root
};
start.Environment["ELECTRON_RUN_AS_NODE"] = "1";
start.ArgumentList.Add(script);
using var child = Process.Start(start);
if (child is null) return 3;
using var timeout = new CancellationTokenSource(TimeSpan.FromHours(1));
Task input = Task.Run(async () => {
    try { await Console.OpenStandardInput().CopyToAsync(child.StandardInput.BaseStream, timeout.Token); }
    finally { child.StandardInput.Close(); }
});
Task output = child.StandardOutput.BaseStream.CopyToAsync(Console.OpenStandardOutput(), timeout.Token);
// Never reflect diagnostics or potentially sensitive content to native messaging output.
Task errors = child.StandardError.BaseStream.CopyToAsync(Stream.Null, timeout.Token);
try {
    await child.WaitForExitAsync(timeout.Token);
    await Task.WhenAll(output, errors);
    return child.ExitCode;
} catch (OperationCanceledException) {
    if (!child.HasExited) child.Kill(entireProcessTree: true);
    return 4;
}
