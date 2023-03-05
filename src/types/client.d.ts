type botOptions = {
  intents: BitFieldResolvable<GatewayIntentsString, number>,
  name: string = "Skeleton Bot",
  base_folder: string,
  token?: string,
  modules_enabled: boolean = true,
}