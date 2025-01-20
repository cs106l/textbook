'use strict';const {makeRecipe}=require('ohm-js');const result=makeRecipe(["grammar",{"source":"MemoryStatement {\r\n  Statement = Allocation | Assignment\r\n  Allocation = identifier \"=>\" Value\r\n  Assignment = identifier Label? \"=\" Value\r\n\r\n  Value = Object | Array | Pointer | ArrayString | StringLiteral | literal\r\n  \r\n  Object = identifier? \"{\" ListOf<Pair, \",\"> \"}\"\r\n  Pair = identifier \":\" Value\r\n\r\n  Array = \"[\" ListOf<Value, \",\"> \"]\"\r\n  \r\n  Pointer = \"&\" Location\r\n  Location = identifier (LocationMemberAccess | LocationSubscript)*\r\n  LocationMemberAccess = \".\" identifier\r\n  LocationSubscript = \"[\" number \"]\"\r\n  \r\n  ArrayString = \"b\" string\r\n  StringLiteral = string\r\n\r\n  string = \"\\\"\" char* \"\\\"\"\r\n  char = nonEscape | escape\r\n  nonEscape = ~(\"\\\\\" | \"\\\"\") any\r\n  escape = \"\\\\\" any\r\n\r\n  literal = (~(\"{\" | \"}\" | \"[\" | \"]\" | \",\") any)+\r\n  \r\n  identifier = (alnum | \"_\" )+\r\n  Label = \"(\" identifier \")\"\r\n  \r\n  number = \"-\"? (zero | nonzero)\r\n  zero = \"0\"\r\n  nonzero = \"1\"..\"9\" digit*\r\n\r\n  /* \r\n   * Directives, e.g. #style, #label\r\n   */\r\n  Directive = LabelDirective | StyleDirective\r\n    \r\n  LabelDirective = \"#label\" (\"stack\" | \"heap\") any+ \r\n    \r\n  StyleDirective = \"#style\" MultiLocation cssClass+\r\n    \r\n  MultiLocation = identifier (LocationMemberAccess | LocationSubscript | LocationSlice)*\r\n  LocationSlice = \"[\" number? \":\" number? (\":\" number?)? \"]\"\r\n    \r\n  cssClass = (alnum | \"_\" | \"-\")+\r\n}"},"MemoryStatement",null,"Statement",{"Statement":["define",{"sourceInterval":[21,56]},null,[],["alt",{"sourceInterval":[33,56]},["app",{"sourceInterval":[33,43]},"Allocation",[]],["app",{"sourceInterval":[46,56]},"Assignment",[]]]],"Allocation":["define",{"sourceInterval":[60,94]},null,[],["seq",{"sourceInterval":[73,94]},["app",{"sourceInterval":[73,83]},"identifier",[]],["terminal",{"sourceInterval":[84,88]},"=>"],["app",{"sourceInterval":[89,94]},"Value",[]]]],"Assignment":["define",{"sourceInterval":[98,138]},null,[],["seq",{"sourceInterval":[111,138]},["app",{"sourceInterval":[111,121]},"identifier",[]],["opt",{"sourceInterval":[122,128]},["app",{"sourceInterval":[122,127]},"Label",[]]],["terminal",{"sourceInterval":[129,132]},"="],["app",{"sourceInterval":[133,138]},"Value",[]]]],"Value":["define",{"sourceInterval":[144,216]},null,[],["alt",{"sourceInterval":[152,216]},["app",{"sourceInterval":[152,158]},"Object",[]],["app",{"sourceInterval":[161,166]},"Array",[]],["app",{"sourceInterval":[169,176]},"Pointer",[]],["app",{"sourceInterval":[179,190]},"ArrayString",[]],["app",{"sourceInterval":[193,206]},"StringLiteral",[]],["app",{"sourceInterval":[209,216]},"literal",[]]]],"Object":["define",{"sourceInterval":[224,270]},null,[],["seq",{"sourceInterval":[233,270]},["opt",{"sourceInterval":[233,244]},["app",{"sourceInterval":[233,243]},"identifier",[]]],["terminal",{"sourceInterval":[245,248]},"{"],["app",{"sourceInterval":[249,266]},"ListOf",[["app",{"sourceInterval":[256,260]},"Pair",[]],["terminal",{"sourceInterval":[262,265]},","]]],["terminal",{"sourceInterval":[267,270]},"}"]]],"Pair":["define",{"sourceInterval":[274,301]},null,[],["seq",{"sourceInterval":[281,301]},["app",{"sourceInterval":[281,291]},"identifier",[]],["terminal",{"sourceInterval":[292,295]},":"],["app",{"sourceInterval":[296,301]},"Value",[]]]],"Array":["define",{"sourceInterval":[307,341]},null,[],["seq",{"sourceInterval":[315,341]},["terminal",{"sourceInterval":[315,318]},"["],["app",{"sourceInterval":[319,337]},"ListOf",[["app",{"sourceInterval":[326,331]},"Value",[]],["terminal",{"sourceInterval":[333,336]},","]]],["terminal",{"sourceInterval":[338,341]},"]"]]],"Pointer":["define",{"sourceInterval":[349,371]},null,[],["seq",{"sourceInterval":[359,371]},["terminal",{"sourceInterval":[359,362]},"&"],["app",{"sourceInterval":[363,371]},"Location",[]]]],"Location":["define",{"sourceInterval":[375,440]},null,[],["seq",{"sourceInterval":[386,440]},["app",{"sourceInterval":[386,396]},"identifier",[]],["star",{"sourceInterval":[397,440]},["alt",{"sourceInterval":[398,438]},["app",{"sourceInterval":[398,418]},"LocationMemberAccess",[]],["app",{"sourceInterval":[421,438]},"LocationSubscript",[]]]]]],"LocationMemberAccess":["define",{"sourceInterval":[444,481]},null,[],["seq",{"sourceInterval":[467,481]},["terminal",{"sourceInterval":[467,470]},"."],["app",{"sourceInterval":[471,481]},"identifier",[]]]],"LocationSubscript":["define",{"sourceInterval":[485,519]},null,[],["seq",{"sourceInterval":[505,519]},["terminal",{"sourceInterval":[505,508]},"["],["app",{"sourceInterval":[509,515]},"number",[]],["terminal",{"sourceInterval":[516,519]},"]"]]],"ArrayString":["define",{"sourceInterval":[527,551]},null,[],["seq",{"sourceInterval":[541,551]},["terminal",{"sourceInterval":[541,544]},"b"],["app",{"sourceInterval":[545,551]},"string",[]]]],"StringLiteral":["define",{"sourceInterval":[555,577]},null,[],["app",{"sourceInterval":[571,577]},"string",[]]],"string":["define",{"sourceInterval":[583,607]},null,[],["seq",{"sourceInterval":[592,607]},["terminal",{"sourceInterval":[592,596]},"\""],["star",{"sourceInterval":[597,602]},["app",{"sourceInterval":[597,601]},"char",[]]],["terminal",{"sourceInterval":[603,607]},"\""]]],"char":["define",{"sourceInterval":[611,636]},null,[],["alt",{"sourceInterval":[618,636]},["app",{"sourceInterval":[618,627]},"nonEscape",[]],["app",{"sourceInterval":[630,636]},"escape",[]]]],"nonEscape":["define",{"sourceInterval":[640,670]},null,[],["seq",{"sourceInterval":[652,670]},["not",{"sourceInterval":[652,666]},["alt",{"sourceInterval":[654,665]},["terminal",{"sourceInterval":[654,658]},"\\"],["terminal",{"sourceInterval":[661,665]},"\""]]],["app",{"sourceInterval":[667,670]},"any",[]]]],"escape":["define",{"sourceInterval":[674,691]},null,[],["seq",{"sourceInterval":[683,691]},["terminal",{"sourceInterval":[683,687]},"\\"],["app",{"sourceInterval":[688,691]},"any",[]]]],"literal":["define",{"sourceInterval":[697,744]},null,[],["plus",{"sourceInterval":[707,744]},["seq",{"sourceInterval":[708,742]},["not",{"sourceInterval":[708,738]},["alt",{"sourceInterval":[710,737]},["terminal",{"sourceInterval":[710,713]},"{"],["terminal",{"sourceInterval":[716,719]},"}"],["terminal",{"sourceInterval":[722,725]},"["],["terminal",{"sourceInterval":[728,731]},"]"],["terminal",{"sourceInterval":[734,737]},","]]],["app",{"sourceInterval":[739,742]},"any",[]]]]],"identifier":["define",{"sourceInterval":[752,780]},null,[],["plus",{"sourceInterval":[765,780]},["alt",{"sourceInterval":[766,777]},["app",{"sourceInterval":[766,771]},"alnum",[]],["terminal",{"sourceInterval":[774,777]},"_"]]]],"Label":["define",{"sourceInterval":[784,810]},null,[],["seq",{"sourceInterval":[792,810]},["terminal",{"sourceInterval":[792,795]},"("],["app",{"sourceInterval":[796,806]},"identifier",[]],["terminal",{"sourceInterval":[807,810]},")"]]],"number":["define",{"sourceInterval":[818,848]},null,[],["seq",{"sourceInterval":[827,848]},["opt",{"sourceInterval":[827,831]},["terminal",{"sourceInterval":[827,830]},"-"]],["alt",{"sourceInterval":[833,847]},["app",{"sourceInterval":[833,837]},"zero",[]],["app",{"sourceInterval":[840,847]},"nonzero",[]]]]],"zero":["define",{"sourceInterval":[852,862]},null,[],["terminal",{"sourceInterval":[859,862]},"0"]],"nonzero":["define",{"sourceInterval":[866,891]},null,[],["seq",{"sourceInterval":[876,891]},["range",{"sourceInterval":[876,884]},"1","9"],["star",{"sourceInterval":[885,891]},["app",{"sourceInterval":[885,890]},"digit",[]]]]],"Directive":["define",{"sourceInterval":[949,992]},null,[],["alt",{"sourceInterval":[961,992]},["app",{"sourceInterval":[961,975]},"LabelDirective",[]],["app",{"sourceInterval":[978,992]},"StyleDirective",[]]]],"LabelDirective":["define",{"sourceInterval":[1002,1051]},null,[],["seq",{"sourceInterval":[1019,1051]},["terminal",{"sourceInterval":[1019,1027]},"#label"],["alt",{"sourceInterval":[1029,1045]},["terminal",{"sourceInterval":[1029,1036]},"stack"],["terminal",{"sourceInterval":[1039,1045]},"heap"]],["plus",{"sourceInterval":[1047,1051]},["app",{"sourceInterval":[1047,1050]},"any",[]]]]],"StyleDirective":["define",{"sourceInterval":[1062,1111]},null,[],["seq",{"sourceInterval":[1079,1111]},["terminal",{"sourceInterval":[1079,1087]},"#style"],["app",{"sourceInterval":[1088,1101]},"MultiLocation",[]],["plus",{"sourceInterval":[1102,1111]},["app",{"sourceInterval":[1102,1110]},"cssClass",[]]]]],"MultiLocation":["define",{"sourceInterval":[1121,1207]},null,[],["seq",{"sourceInterval":[1137,1207]},["app",{"sourceInterval":[1137,1147]},"identifier",[]],["star",{"sourceInterval":[1148,1207]},["alt",{"sourceInterval":[1149,1205]},["app",{"sourceInterval":[1149,1169]},"LocationMemberAccess",[]],["app",{"sourceInterval":[1172,1189]},"LocationSubscript",[]],["app",{"sourceInterval":[1192,1205]},"LocationSlice",[]]]]]],"LocationSlice":["define",{"sourceInterval":[1211,1269]},null,[],["seq",{"sourceInterval":[1227,1269]},["terminal",{"sourceInterval":[1227,1230]},"["],["opt",{"sourceInterval":[1231,1238]},["app",{"sourceInterval":[1231,1237]},"number",[]]],["terminal",{"sourceInterval":[1239,1242]},":"],["opt",{"sourceInterval":[1243,1250]},["app",{"sourceInterval":[1243,1249]},"number",[]]],["opt",{"sourceInterval":[1251,1265]},["seq",{"sourceInterval":[1252,1263]},["terminal",{"sourceInterval":[1252,1255]},":"],["opt",{"sourceInterval":[1256,1263]},["app",{"sourceInterval":[1256,1262]},"number",[]]]]],["terminal",{"sourceInterval":[1266,1269]},"]"]]],"cssClass":["define",{"sourceInterval":[1279,1310]},null,[],["plus",{"sourceInterval":[1290,1310]},["alt",{"sourceInterval":[1291,1308]},["app",{"sourceInterval":[1291,1296]},"alnum",[]],["terminal",{"sourceInterval":[1299,1302]},"_"],["terminal",{"sourceInterval":[1305,1308]},"-"]]]]}]);module.exports=result;