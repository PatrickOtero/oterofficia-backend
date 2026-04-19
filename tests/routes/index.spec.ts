import { router } from "../../src/routes";

type RouterLayer = {
  handle?: {
    stack?: Array<{
      route?: {
        path?: string;
      };
    }>;
  };
  regexp?: RegExp;
};

describe("router", () => {
  it("mounts admin study comments before generic admin study id routes", () => {
    const adminStudiesLayers = ((router as unknown as { stack?: RouterLayer[] }).stack || []).filter(
      (layer) => String(layer.regexp) === "/^\\/admin\\/studies\\/?(?=\\/|$)/i"
    );

    expect(adminStudiesLayers).toHaveLength(2);

    const firstMountedPaths = (adminStudiesLayers[0].handle?.stack || [])
      .map((layer) => layer.route?.path)
      .filter(Boolean);
    const secondMountedPaths = (adminStudiesLayers[1].handle?.stack || [])
      .map((layer) => layer.route?.path)
      .filter(Boolean);

    expect(firstMountedPaths).toContain("/comments");
    expect(secondMountedPaths).toContain("/:id");
  });
});
