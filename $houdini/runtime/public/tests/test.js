import { testConfigFile } from "../../../test";
import { Cache as _Cache } from "../../cache/cache";
import {
  ArtifactKind
} from "../../lib";
import { Cache } from "../cache";
const testCache = () => new Cache(new _Cache(testConfigFile()));
const testFragment = (selection) => ({
  artifact: {
    kind: ArtifactKind.Fragment,
    hash: "",
    raw: "",
    name: "",
    rootType: "User",
    selection
  }
});
const testQuery = (selection) => ({
  artifact: {
    kind: ArtifactKind.Query,
    hash: "",
    raw: "",
    name: "",
    rootType: "Query",
    selection
  }
});
export {
  testCache,
  testFragment,
  testQuery
};
