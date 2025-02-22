import VagonStreamsAPI, { ConfigurationError, HTTP_Error, ApplicationListResponse } from "./index";

test("Fail if not configured", () => {
    expect(() => new VagonStreamsAPI(undefined as any)).toThrow(ConfigurationError);
});


test("Throws error on wrong auth", async () => {
    const api = new VagonStreamsAPI({
        api_key: "test",
        api_secret: "test",
    });

    await expect(api.application_list()).rejects.toThrow(HTTP_Error);
});

test("Test list applications", async () => {

    const api = new VagonStreamsAPI({
        api_key: process.env.VAGON_API_KEY as string,
        api_secret: process.env.VAGON_API_SECRET as string,
    });

    await expect(api.application_list()).resolves.toHaveProperty("applications");
});
