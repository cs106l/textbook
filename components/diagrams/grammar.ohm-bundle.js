'use strict';const {makeRecipe}=require('ohm-js');const result=makeRecipe(["grammar",{"source":"MemoryDiagram {\n  /*\n   * Diagram structure\n   */\n   \n   Diagram \n    = SubDiagram+ --multi\n    | Lines       --single\n   SubDiagram = identifier \"{\" Lines \"}\"\n   Lines = Line*\n   Line = Statement | Directive | FrameHeader\n   FrameHeader = identifier \":\"\n\n  /* \n   * Statements: assignments and allocations\n   */\n  Statement = (Allocation | Assignment)\n  Allocation = identifier \"=>\" Value\n  Assignment = identifier Label? \"=\" Value\n  Label = \"(\" string \")\"\n\n  Value = Object | Array | Pointer | ArrayString | StringLiteral | literal\n  \n  Object = identifier? \"{\" ListOf<Pair, \",\"> \"}\"\n  Pair = identifier \":\" Value\n\n  Array = \"[\" ListOf<Value, \",\"> \"]\"\n  \n  Pointer = \"&\" Location\n  Location = identifier (LocationMemberAccess | LocationSubscript)*\n  LocationMemberAccess = \".\" identifier\n  LocationSubscript = \"[\" int \"]\"\n  \n  ArrayString = \"b\" string\n  StringLiteral = string\n  literal = (~(\"{\" | \"}\" | \"[\" | \"]\" | \",\" | \"\\n\") any)+\n\n  /* \n   * Directives, e.g. #style, #label\n   */\n  Directive = LabelDirective | StyleDirective | LayoutDirective\n    \n  LabelDirective = \"#label\" (LabelLocation) string\n  LabelLocation = \"stack\" | \"heap\" | \"title\" | \"subtitle\"\n    \n  StyleDirective = \"#style\" (LabelStyle | NodeStyles | LinkStyle)\n  LabelStyle = \"label:\" LabelLocation Styles\n  NodeStyles = ((\"value\" | \"name\" | \"row\") \":\")? MultiLocation Styles\n  LinkStyle = \"link:\" MultiLocation JsonObject\n  Styles = (cssClass | JsonObject)+\n\n  LayoutDirective = \"#layout\" \"wide\"\n  \n  MultiLocation = identifier (LocationMemberAccess | LocationSubscript | LocationSlice)*\n  LocationSlice = \"[\" int? \":\" int? (\":\" int?)? \"]\"\n  \n  cssClass = (alnum | \"_\" | \"-\")+\n  \n  /*\n   * Utilities and simple JSON parser\n   */ \n   \n  identifier = (alnum | \"_\" | \"<\" | \">\" )+\n  \n  string = \"\\\"\" char* \"\\\"\"\n  char = nonEscape | escape\n  nonEscape = ~(\"\\\\\" | \"\\\"\") any\n  escape = \"\\\\\" any\n  \n  number = float | int\n  int = \"-\"? digit+\n  float = \"-\"? digit* \".\" digit+\n  \n  JsonValue = JsonObject | JsonArray | JsonBool | string | number | cssClass\n  JsonObject = \"{\" ListOf<JsonPair, \",\"> \"}\"\n  JsonArray = \"[\" ListOf<JsonValue, \",\"> \"]\"\n  JsonPair = (cssClass | string) \":\" JsonValue\n  JsonBool = \"true\" | \"false\"\n}"},"MemoryDiagram",null,"Diagram",{"Diagram_multi":["define",{"sourceInterval":[72,91]},null,[],["plus",{"sourceInterval":[72,83]},["app",{"sourceInterval":[72,82]},"SubDiagram",[]]]],"Diagram_single":["define",{"sourceInterval":[98,118]},null,[],["app",{"sourceInterval":[98,103]},"Lines",[]]],"Diagram":["define",{"sourceInterval":[57,118]},null,[],["alt",{"sourceInterval":[72,118]},["app",{"sourceInterval":[72,83]},"Diagram_multi",[]],["app",{"sourceInterval":[98,103]},"Diagram_single",[]]]],"SubDiagram":["define",{"sourceInterval":[122,159]},null,[],["seq",{"sourceInterval":[135,159]},["app",{"sourceInterval":[135,145]},"identifier",[]],["terminal",{"sourceInterval":[146,149]},"{"],["app",{"sourceInterval":[150,155]},"Lines",[]],["terminal",{"sourceInterval":[156,159]},"}"]]],"Lines":["define",{"sourceInterval":[163,176]},null,[],["star",{"sourceInterval":[171,176]},["app",{"sourceInterval":[171,175]},"Line",[]]]],"Line":["define",{"sourceInterval":[180,222]},null,[],["alt",{"sourceInterval":[187,222]},["app",{"sourceInterval":[187,196]},"Statement",[]],["app",{"sourceInterval":[199,208]},"Directive",[]],["app",{"sourceInterval":[211,222]},"FrameHeader",[]]]],"FrameHeader":["define",{"sourceInterval":[226,254]},null,[],["seq",{"sourceInterval":[240,254]},["app",{"sourceInterval":[240,250]},"identifier",[]],["terminal",{"sourceInterval":[251,254]},":"]]],"Statement":["define",{"sourceInterval":[315,352]},null,[],["alt",{"sourceInterval":[327,352]},["app",{"sourceInterval":[328,338]},"Allocation",[]],["app",{"sourceInterval":[341,351]},"Assignment",[]]]],"Allocation":["define",{"sourceInterval":[355,389]},null,[],["seq",{"sourceInterval":[368,389]},["app",{"sourceInterval":[368,378]},"identifier",[]],["terminal",{"sourceInterval":[379,383]},"=>"],["app",{"sourceInterval":[384,389]},"Value",[]]]],"Assignment":["define",{"sourceInterval":[392,432]},null,[],["seq",{"sourceInterval":[405,432]},["app",{"sourceInterval":[405,415]},"identifier",[]],["opt",{"sourceInterval":[416,422]},["app",{"sourceInterval":[416,421]},"Label",[]]],["terminal",{"sourceInterval":[423,426]},"="],["app",{"sourceInterval":[427,432]},"Value",[]]]],"Label":["define",{"sourceInterval":[435,457]},null,[],["seq",{"sourceInterval":[443,457]},["terminal",{"sourceInterval":[443,446]},"("],["app",{"sourceInterval":[447,453]},"string",[]],["terminal",{"sourceInterval":[454,457]},")"]]],"Value":["define",{"sourceInterval":[461,533]},null,[],["alt",{"sourceInterval":[469,533]},["app",{"sourceInterval":[469,475]},"Object",[]],["app",{"sourceInterval":[478,483]},"Array",[]],["app",{"sourceInterval":[486,493]},"Pointer",[]],["app",{"sourceInterval":[496,507]},"ArrayString",[]],["app",{"sourceInterval":[510,523]},"StringLiteral",[]],["app",{"sourceInterval":[526,533]},"literal",[]]]],"Object":["define",{"sourceInterval":[539,585]},null,[],["seq",{"sourceInterval":[548,585]},["opt",{"sourceInterval":[548,559]},["app",{"sourceInterval":[548,558]},"identifier",[]]],["terminal",{"sourceInterval":[560,563]},"{"],["app",{"sourceInterval":[564,581]},"ListOf",[["app",{"sourceInterval":[571,575]},"Pair",[]],["terminal",{"sourceInterval":[577,580]},","]]],["terminal",{"sourceInterval":[582,585]},"}"]]],"Pair":["define",{"sourceInterval":[588,615]},null,[],["seq",{"sourceInterval":[595,615]},["app",{"sourceInterval":[595,605]},"identifier",[]],["terminal",{"sourceInterval":[606,609]},":"],["app",{"sourceInterval":[610,615]},"Value",[]]]],"Array":["define",{"sourceInterval":[619,653]},null,[],["seq",{"sourceInterval":[627,653]},["terminal",{"sourceInterval":[627,630]},"["],["app",{"sourceInterval":[631,649]},"ListOf",[["app",{"sourceInterval":[638,643]},"Value",[]],["terminal",{"sourceInterval":[645,648]},","]]],["terminal",{"sourceInterval":[650,653]},"]"]]],"Pointer":["define",{"sourceInterval":[659,681]},null,[],["seq",{"sourceInterval":[669,681]},["terminal",{"sourceInterval":[669,672]},"&"],["app",{"sourceInterval":[673,681]},"Location",[]]]],"Location":["define",{"sourceInterval":[684,749]},null,[],["seq",{"sourceInterval":[695,749]},["app",{"sourceInterval":[695,705]},"identifier",[]],["star",{"sourceInterval":[706,749]},["alt",{"sourceInterval":[707,747]},["app",{"sourceInterval":[707,727]},"LocationMemberAccess",[]],["app",{"sourceInterval":[730,747]},"LocationSubscript",[]]]]]],"LocationMemberAccess":["define",{"sourceInterval":[752,789]},null,[],["seq",{"sourceInterval":[775,789]},["terminal",{"sourceInterval":[775,778]},"."],["app",{"sourceInterval":[779,789]},"identifier",[]]]],"LocationSubscript":["define",{"sourceInterval":[792,823]},null,[],["seq",{"sourceInterval":[812,823]},["terminal",{"sourceInterval":[812,815]},"["],["app",{"sourceInterval":[816,819]},"int",[]],["terminal",{"sourceInterval":[820,823]},"]"]]],"ArrayString":["define",{"sourceInterval":[829,853]},null,[],["seq",{"sourceInterval":[843,853]},["terminal",{"sourceInterval":[843,846]},"b"],["app",{"sourceInterval":[847,853]},"string",[]]]],"StringLiteral":["define",{"sourceInterval":[856,878]},null,[],["app",{"sourceInterval":[872,878]},"string",[]]],"literal":["define",{"sourceInterval":[881,935]},null,[],["plus",{"sourceInterval":[891,935]},["seq",{"sourceInterval":[892,933]},["not",{"sourceInterval":[892,929]},["alt",{"sourceInterval":[894,928]},["terminal",{"sourceInterval":[894,897]},"{"],["terminal",{"sourceInterval":[900,903]},"}"],["terminal",{"sourceInterval":[906,909]},"["],["terminal",{"sourceInterval":[912,915]},"]"],["terminal",{"sourceInterval":[918,921]},","],["terminal",{"sourceInterval":[924,928]},"\n"]]],["app",{"sourceInterval":[930,933]},"any",[]]]]],"Directive":["define",{"sourceInterval":[988,1049]},null,[],["alt",{"sourceInterval":[1000,1049]},["app",{"sourceInterval":[1000,1014]},"LabelDirective",[]],["app",{"sourceInterval":[1017,1031]},"StyleDirective",[]],["app",{"sourceInterval":[1034,1049]},"LayoutDirective",[]]]],"LabelDirective":["define",{"sourceInterval":[1057,1105]},null,[],["seq",{"sourceInterval":[1074,1105]},["terminal",{"sourceInterval":[1074,1082]},"#label"],["app",{"sourceInterval":[1084,1097]},"LabelLocation",[]],["app",{"sourceInterval":[1099,1105]},"string",[]]]],"LabelLocation":["define",{"sourceInterval":[1108,1163]},null,[],["alt",{"sourceInterval":[1124,1163]},["terminal",{"sourceInterval":[1124,1131]},"stack"],["terminal",{"sourceInterval":[1134,1140]},"heap"],["terminal",{"sourceInterval":[1143,1150]},"title"],["terminal",{"sourceInterval":[1153,1163]},"subtitle"]]],"StyleDirective":["define",{"sourceInterval":[1171,1234]},null,[],["seq",{"sourceInterval":[1188,1234]},["terminal",{"sourceInterval":[1188,1196]},"#style"],["alt",{"sourceInterval":[1198,1233]},["app",{"sourceInterval":[1198,1208]},"LabelStyle",[]],["app",{"sourceInterval":[1211,1221]},"NodeStyles",[]],["app",{"sourceInterval":[1224,1233]},"LinkStyle",[]]]]],"LabelStyle":["define",{"sourceInterval":[1237,1279]},null,[],["seq",{"sourceInterval":[1250,1279]},["terminal",{"sourceInterval":[1250,1258]},"label:"],["app",{"sourceInterval":[1259,1272]},"LabelLocation",[]],["app",{"sourceInterval":[1273,1279]},"Styles",[]]]],"NodeStyles":["define",{"sourceInterval":[1282,1349]},null,[],["seq",{"sourceInterval":[1295,1349]},["opt",{"sourceInterval":[1295,1328]},["seq",{"sourceInterval":[1296,1326]},["alt",{"sourceInterval":[1297,1321]},["terminal",{"sourceInterval":[1297,1304]},"value"],["terminal",{"sourceInterval":[1307,1313]},"name"],["terminal",{"sourceInterval":[1316,1321]},"row"]],["terminal",{"sourceInterval":[1323,1326]},":"]]],["app",{"sourceInterval":[1329,1342]},"MultiLocation",[]],["app",{"sourceInterval":[1343,1349]},"Styles",[]]]],"LinkStyle":["define",{"sourceInterval":[1352,1396]},null,[],["seq",{"sourceInterval":[1364,1396]},["terminal",{"sourceInterval":[1364,1371]},"link:"],["app",{"sourceInterval":[1372,1385]},"MultiLocation",[]],["app",{"sourceInterval":[1386,1396]},"JsonObject",[]]]],"Styles":["define",{"sourceInterval":[1399,1432]},null,[],["plus",{"sourceInterval":[1408,1432]},["alt",{"sourceInterval":[1409,1430]},["app",{"sourceInterval":[1409,1417]},"cssClass",[]],["app",{"sourceInterval":[1420,1430]},"JsonObject",[]]]]],"LayoutDirective":["define",{"sourceInterval":[1436,1470]},null,[],["seq",{"sourceInterval":[1454,1470]},["terminal",{"sourceInterval":[1454,1463]},"#layout"],["terminal",{"sourceInterval":[1464,1470]},"wide"]]],"MultiLocation":["define",{"sourceInterval":[1476,1562]},null,[],["seq",{"sourceInterval":[1492,1562]},["app",{"sourceInterval":[1492,1502]},"identifier",[]],["star",{"sourceInterval":[1503,1562]},["alt",{"sourceInterval":[1504,1560]},["app",{"sourceInterval":[1504,1524]},"LocationMemberAccess",[]],["app",{"sourceInterval":[1527,1544]},"LocationSubscript",[]],["app",{"sourceInterval":[1547,1560]},"LocationSlice",[]]]]]],"LocationSlice":["define",{"sourceInterval":[1565,1614]},null,[],["seq",{"sourceInterval":[1581,1614]},["terminal",{"sourceInterval":[1581,1584]},"["],["opt",{"sourceInterval":[1585,1589]},["app",{"sourceInterval":[1585,1588]},"int",[]]],["terminal",{"sourceInterval":[1590,1593]},":"],["opt",{"sourceInterval":[1594,1598]},["app",{"sourceInterval":[1594,1597]},"int",[]]],["opt",{"sourceInterval":[1599,1610]},["seq",{"sourceInterval":[1600,1608]},["terminal",{"sourceInterval":[1600,1603]},":"],["opt",{"sourceInterval":[1604,1608]},["app",{"sourceInterval":[1604,1607]},"int",[]]]]],["terminal",{"sourceInterval":[1611,1614]},"]"]]],"cssClass":["define",{"sourceInterval":[1620,1651]},null,[],["plus",{"sourceInterval":[1631,1651]},["alt",{"sourceInterval":[1632,1649]},["app",{"sourceInterval":[1632,1637]},"alnum",[]],["terminal",{"sourceInterval":[1640,1643]},"_"],["terminal",{"sourceInterval":[1646,1649]},"-"]]]],"identifier":["define",{"sourceInterval":[1711,1751]},null,[],["plus",{"sourceInterval":[1724,1751]},["alt",{"sourceInterval":[1725,1748]},["app",{"sourceInterval":[1725,1730]},"alnum",[]],["terminal",{"sourceInterval":[1733,1736]},"_"],["terminal",{"sourceInterval":[1739,1742]},"<"],["terminal",{"sourceInterval":[1745,1748]},">"]]]],"string":["define",{"sourceInterval":[1757,1781]},null,[],["seq",{"sourceInterval":[1766,1781]},["terminal",{"sourceInterval":[1766,1770]},"\""],["star",{"sourceInterval":[1771,1776]},["app",{"sourceInterval":[1771,1775]},"char",[]]],["terminal",{"sourceInterval":[1777,1781]},"\""]]],"char":["define",{"sourceInterval":[1784,1809]},null,[],["alt",{"sourceInterval":[1791,1809]},["app",{"sourceInterval":[1791,1800]},"nonEscape",[]],["app",{"sourceInterval":[1803,1809]},"escape",[]]]],"nonEscape":["define",{"sourceInterval":[1812,1842]},null,[],["seq",{"sourceInterval":[1824,1842]},["not",{"sourceInterval":[1824,1838]},["alt",{"sourceInterval":[1826,1837]},["terminal",{"sourceInterval":[1826,1830]},"\\"],["terminal",{"sourceInterval":[1833,1837]},"\""]]],["app",{"sourceInterval":[1839,1842]},"any",[]]]],"escape":["define",{"sourceInterval":[1845,1862]},null,[],["seq",{"sourceInterval":[1854,1862]},["terminal",{"sourceInterval":[1854,1858]},"\\"],["app",{"sourceInterval":[1859,1862]},"any",[]]]],"number":["define",{"sourceInterval":[1868,1888]},null,[],["alt",{"sourceInterval":[1877,1888]},["app",{"sourceInterval":[1877,1882]},"float",[]],["app",{"sourceInterval":[1885,1888]},"int",[]]]],"int":["define",{"sourceInterval":[1891,1908]},null,[],["seq",{"sourceInterval":[1897,1908]},["opt",{"sourceInterval":[1897,1901]},["terminal",{"sourceInterval":[1897,1900]},"-"]],["plus",{"sourceInterval":[1902,1908]},["app",{"sourceInterval":[1902,1907]},"digit",[]]]]],"float":["define",{"sourceInterval":[1911,1941]},null,[],["seq",{"sourceInterval":[1919,1941]},["opt",{"sourceInterval":[1919,1923]},["terminal",{"sourceInterval":[1919,1922]},"-"]],["star",{"sourceInterval":[1924,1930]},["app",{"sourceInterval":[1924,1929]},"digit",[]]],["terminal",{"sourceInterval":[1931,1934]},"."],["plus",{"sourceInterval":[1935,1941]},["app",{"sourceInterval":[1935,1940]},"digit",[]]]]],"JsonValue":["define",{"sourceInterval":[1947,2021]},null,[],["alt",{"sourceInterval":[1959,2021]},["app",{"sourceInterval":[1959,1969]},"JsonObject",[]],["app",{"sourceInterval":[1972,1981]},"JsonArray",[]],["app",{"sourceInterval":[1984,1992]},"JsonBool",[]],["app",{"sourceInterval":[1995,2001]},"string",[]],["app",{"sourceInterval":[2004,2010]},"number",[]],["app",{"sourceInterval":[2013,2021]},"cssClass",[]]]],"JsonObject":["define",{"sourceInterval":[2024,2066]},null,[],["seq",{"sourceInterval":[2037,2066]},["terminal",{"sourceInterval":[2037,2040]},"{"],["app",{"sourceInterval":[2041,2062]},"ListOf",[["app",{"sourceInterval":[2048,2056]},"JsonPair",[]],["terminal",{"sourceInterval":[2058,2061]},","]]],["terminal",{"sourceInterval":[2063,2066]},"}"]]],"JsonArray":["define",{"sourceInterval":[2069,2111]},null,[],["seq",{"sourceInterval":[2081,2111]},["terminal",{"sourceInterval":[2081,2084]},"["],["app",{"sourceInterval":[2085,2107]},"ListOf",[["app",{"sourceInterval":[2092,2101]},"JsonValue",[]],["terminal",{"sourceInterval":[2103,2106]},","]]],["terminal",{"sourceInterval":[2108,2111]},"]"]]],"JsonPair":["define",{"sourceInterval":[2114,2158]},null,[],["seq",{"sourceInterval":[2125,2158]},["alt",{"sourceInterval":[2126,2143]},["app",{"sourceInterval":[2126,2134]},"cssClass",[]],["app",{"sourceInterval":[2137,2143]},"string",[]]],["terminal",{"sourceInterval":[2145,2148]},":"],["app",{"sourceInterval":[2149,2158]},"JsonValue",[]]]],"JsonBool":["define",{"sourceInterval":[2161,2188]},null,[],["alt",{"sourceInterval":[2172,2188]},["terminal",{"sourceInterval":[2172,2178]},"true"],["terminal",{"sourceInterval":[2181,2188]},"false"]]]}]);module.exports=result;