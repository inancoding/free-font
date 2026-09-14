import type { CharsetDef, ScriptId } from './types'

// 简繁特有字对照表：每两个字符为一组，前者为简体特有、后者为对应繁体特有。
// 仅收录简繁字形不同的字（如 语/語），保证两侧字符集一一对应。
// 已剔除在传统字库中也存在的字符（如 后、里、丑、准、范、叶、冲）。
const HAN_PAIRS =
  '爱愛碍礙罢罷备備笔筆闭閉边邊变變宾賓补補参參蚕蠶灿燦苍蒼层層产產尝嘗长長偿償厂廠彻徹尘塵陈陳衬襯撑撐称稱惩懲诚誠迟遲宠寵触觸处處传傳创創纯純辞辭词詞聪聰丛叢达達带帶担擔胆膽导導灯燈敌敵涤滌递遞点點电電垫墊钓釣调調叠疊钉釘顶頂订訂东東动動栋棟冻凍独獨读讀赌賭锻鍛断斷对對吨噸顿頓钝鈍夺奪额額尔爾发發罚罰阀閥烦煩贩販饭飯访訪纺紡飞飛废廢费費纷紛坟墳奋奮愤憤丰豐锋鋒风風凤鳳肤膚辐輻抚撫辅輔复復负負妇婦缚縛该該盖蓋赶趕冈岡刚剛钢鋼纲綱岗崗个個巩鞏贡貢沟溝构構购購顾顧关關观觀馆館惯慣广廣规規归歸轨軌柜櫃国國过過还還汉漢号號轰轟护護壶壺沪滬华華画畫划劃怀懷坏壞欢歡环環换換黄黃谎謊汇匯会會绘繪浑渾获獲货貨击擊积積极極际際继繼夹夾价價艰艱监監简簡减減荐薦鉴鑑舰艦将將浆漿奖獎讲講骄驕桥橋洁潔结結尽盡进進劲勁经經惊驚紧緊锦錦谨謹据據剧劇惧懼决決绝絕开開凯凱恳懇扩擴宽寬矿礦况況亏虧来來赖賴兰蘭拦攔烂爛劳勞乐樂垒壘类類离離历歷厉厲励勵连連怜憐联聯炼煉练練粮糧两兩辆輛谅諒疗療辽遼猎獵邻鄰临臨灵靈龄齡刘劉龙龍娄婁楼樓录錄陆陸驴驢乱亂伦倫论論罗羅骆駱络絡妈媽马馬骂罵吗嗎买買卖賣麦麥蛮蠻满滿猫貓贸貿么麼门門梦夢弥彌庙廟灭滅悯憫鸣鳴铭銘谋謀难難脑腦恼惱闹鬧拟擬酿釀鸟鳥聂聶宁寧拧擰农農纽紐浓濃诺諾欧歐盘盤庞龐抛拋赔賠喷噴鹏鵬骗騙苹蘋凭憑泼潑铺鋪扑撲谱譜气氣牵牽签簽迁遷铅鉛谦謙钱錢潜潛浅淺枪槍墙牆强強抢搶亲親轻輕倾傾庆慶穷窮驱驅权權劝勸却卻确確让讓扰擾热熱认認荣榮绒絨软軟锐銳润潤洒灑伞傘丧喪扫掃涩澀杀殺纱紗筛篩晒曬伤傷赏賞烧燒绍紹赊賒摄攝设設审審圣聖胜勝湿濕实實识識时時势勢试試饰飾视視寿壽兽獸书書术術树樹帅帥双雙顺順说說丝絲孙孫损損态態坛壇叹嘆汤湯涛濤讨討腾騰体體条條铁鐵厅廳听聽统統头頭图圖团團袜襪弯彎网網为為围圍卫衛稳穩务務雾霧误誤献獻县縣现現线線宪憲乡鄉详詳响響项項萧蕭晓曉协協写寫谢謝兴興须須许許续續选選学學压壓盐鹽严嚴厌厭阳陽养養样樣页頁业業医醫亿億忆憶义義阴陰银銀饮飲应應营營优優邮郵犹猶鱼魚与與语語誉譽园園员員远遠愿願约約跃躍运運蕴蘊杂雜脏髒暂暫战戰张張赵趙这這贞貞针針诊診证證郑鄭织織职職执執纸紙质質钟鐘众眾种種猪豬烛燭专專转轉装裝壮壯状狀资資总總组組钻鑽们們'

export const HANS_ONLY: string[] = []
export const HANT_ONLY: string[] = []
for (let i = 0; i < HAN_PAIRS.length; i += 2) {
  HANS_ONLY.push(HAN_PAIRS[i]!)
  HANT_ONLY.push(HAN_PAIRS[i + 1]!)
}

export const LETTERS: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
export const DIGITS: string[] = '0123456789'.split('')

export const SCRIPT_ORDER: ScriptId[] = ['hans', 'hant', 'letter', 'digit']

export const SCRIPT_LABELS: Record<ScriptId, string> = {
  hans: '简体汉字',
  hant: '繁体汉字',
  letter: '英文字母',
  digit: '数字',
}

// 字符集表驱动：新增语种（日文假名、韩文谚文等）只需在此追加定义与判定规则（见 detect.ts）
export const CHARSET_TABLE: CharsetDef[] = [
  { id: 'hans', label: SCRIPT_LABELS.hans, chars: HANS_ONLY },
  { id: 'hant', label: SCRIPT_LABELS.hant, chars: HANT_ONLY },
  { id: 'letter', label: SCRIPT_LABELS.letter, chars: LETTERS },
  { id: 'digit', label: SCRIPT_LABELS.digit, chars: DIGITS },
]
