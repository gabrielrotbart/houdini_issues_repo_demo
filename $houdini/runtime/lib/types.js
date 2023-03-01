const CachePolicy = {
  CacheOrNetwork: "CacheOrNetwork",
  CacheOnly: "CacheOnly",
  NetworkOnly: "NetworkOnly",
  CacheAndNetwork: "CacheAndNetwork"
};
const ArtifactKind = {
  Query: "HoudiniQuery",
  Subscription: "HoudiniSubscription",
  Mutation: "HoudiniMutation",
  Fragment: "HoudiniFragment"
};
const CompiledFragmentKind = ArtifactKind.Fragment;
const CompiledMutationKind = ArtifactKind.Mutation;
const CompiledQueryKind = ArtifactKind.Query;
const CompiledSubscriptionKind = ArtifactKind.Subscription;
const RefetchUpdateMode = {
  append: "append",
  prepend: "prepend",
  replace: "replace"
};
const DataSource = {
  Cache: "cache",
  Network: "network",
  Ssr: "ssr"
};
export {
  ArtifactKind,
  CachePolicy,
  CompiledFragmentKind,
  CompiledMutationKind,
  CompiledQueryKind,
  CompiledSubscriptionKind,
  DataSource,
  RefetchUpdateMode
};
