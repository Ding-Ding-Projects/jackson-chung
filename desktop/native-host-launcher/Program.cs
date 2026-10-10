using System.Diagnostics;

// Install beside JacksonChung.exe. Browser-provided arguments are never forwarded.
string root = AppContext.BaseDirectory;
string executable = Path.Combine(root, "JacksonChung.exe");
string script = Path.Combine(root, "resources", "app.asar.unpacked", "desktop", "native-host.cjs");
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
