import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";

const options = JSON.parse(readFileSync("/data/options.json", "utf8"));
const args = [
    "--storage-path=/data",
    "--port=5580",
    `--log-level=${options.log_level ?? "info"}`,
];

if (options.enable_test_net_dcl) args.push("--enable-test-net-dcl");
if (options.allow_attestation_failure) args.push("--allow-attestation-failure");
if (options.ble_proxy) args.push("--ble-proxy");
if (options.bluetooth_adapter_id !== undefined) {
    args.push(`--bluetooth-adapter=${options.bluetooth_adapter_id}`);
}
if (options.default_fabric_label) args.push(`--default-fabric-label=${options.default_fabric_label}`);
if (options.time_sync === "on") {
    args.push("--enable-time-sync");
} else if (options.time_sync === "auto") {
    try {
        const synchronized = execFileSync("timedatectl", ["show", "--property=NTPSynchronized", "--value"], {
            encoding: "utf8",
            timeout: 3000,
        }).trim();
        if (synchronized === "yes") args.push("--enable-time-sync");
        else if (synchronized !== "no") throw new Error(`Unexpected timedatectl result: ${synchronized}`);
    } catch (error) {
        console.warn(
            "Could not determine host NTP synchronization for time_sync=auto; Matter device time sync remains disabled:",
            error,
        );
    }
}
if (Array.isArray(options.matter_server_args)) args.push(...options.matter_server_args);

const env = { ...process.env };
for (const value of options.matter_server_env_vars ?? []) {
    const separator = value.indexOf("=");
    if (separator <= 0) throw new Error(`Invalid matter_server_env_vars entry: ${value}`);
    env[value.slice(0, separator)] = value.slice(separator + 1);
}

const server = spawn(
    process.execPath,
    ["--enable-source-maps", "/app/packages/matter-server/dist/esm/MatterServer.js", ...args],
    { env, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.kill(signal));
}

server.on("error", error => {
    console.error("Failed to start Matter Server:", error);
    process.exitCode = 1;
});
server.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
});
