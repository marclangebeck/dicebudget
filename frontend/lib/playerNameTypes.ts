export type PlayerNameAliasDto = {
  aliasName: string;
  canonicalName: string;
};

export type PlayerNamesDto = {
  names: string[];
  aliases: PlayerNameAliasDto[];
};
