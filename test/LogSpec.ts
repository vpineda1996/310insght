import Log from "../src/Util"

describe("Log usless test", function() {

    it("tests log", () => {
        Log.test("wat");
        Log.info("hello");
        Log.warn("oh no!");
        Log.error("bad things will happen :()");
    });

});