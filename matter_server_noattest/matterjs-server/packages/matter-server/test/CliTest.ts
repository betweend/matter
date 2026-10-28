/**
 * @license
 * Copyright 2025-2026 Open Home Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

describe("CLI", () => {
    it("keeps attestation failure bypass disabled by default", async () => {
        const { parseCliArgs } = await import(new URL("../../../dist/esm/cli.js", import.meta.url).href);
        expect(parseCliArgs(["node", "matter-server"]).allowAttestationFailure).to.be.false;
    });

    it("enables attestation failure bypass only when requested", async () => {
        const { parseCliArgs } = await import(new URL("../../../dist/esm/cli.js", import.meta.url).href);
        expect(parseCliArgs(["node", "matter-server", "--allow-attestation-failure"]).allowAttestationFailure).to.be
            .true;
    });
});
