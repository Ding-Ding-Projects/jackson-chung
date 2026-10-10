import {defaults,getState,getSettingsProvenance,translate as t,type Settings} from '../../state/store';
import {getSchedules,scheduleMatches,appliedScheduleFields} from './schedule-state';
import {getSchoolState} from '../../state/school';
type Entry={key:keyof Settings;en:string;yue:string;purpose:[string,string]};
/** Handwritten inventory of every settings value edited on the visitor settings surface. */
export const settingExplanations:Entry[]=[
 {key:'locale',en:'Language',yue:'語言',purpose:['Choose the interface language. The presentation restriction forces English while preserving this choice.','選擇介面語言。顯示限制啟用時強制用英文，但保留此選擇。']},
 {key:'funnyEn',en:'English humour',yue:'英文趣味',purpose:['Style English messages, including warnings, from serious 1 to playful 5 without changing facts.','英文訊息包括警告，由認真第一級至趣味第五級，只改語氣，唔改事實。']},
 {key:'funnyYue',en:'Cantonese humour',yue:'廣東話趣味',purpose:['Style Cantonese messages independently from English, from serious 1 to playful 5.','廣東話訊息獨立設定，由認真第一級至趣味第五級。']},
 {key:'emojis',en:'Message emojis',yue:'訊息表情符號',purpose:['Allow decorative emojis in messages. Their meaning remains in the text.','容許訊息加入裝飾表情符號，意思仍由文字表達。']},
 {key:'theme',en:'Theme',yue:'主題',purpose:['Choose light, dark or the device preference. Device mode resolves at presentation time.','選擇淺色、深色或裝置偏好。裝置模式會喺顯示時決定。']},
 {key:'density',en:'Density',yue:'密度',purpose:['Choose the spacing preference for controls; usable targets remain required.','選擇控制間距偏好，操作範圍仍須足夠。']},
 {key:'font',en:'Font',yue:'字款',purpose:['Choose device, serif or monospace text presentation.','選擇裝置、襯線或等寬字款。']},
 {key:'fontSize',en:'Text size',yue:'字體大小',purpose:['Set the base text size from 12 to 24 pixels; relative text sizes follow it.','設定十二至二十四像素基礎字體，相對大小文字會跟隨。']},
 {key:'seed',en:'Seed colour',yue:'種子顏色',purpose:['Generate the colour scheme from this colour. Low stimulation substitutes a muted seed while active.','用此顏色產生配色。低刺激啟用時會暫用柔和種子色。']},
 {key:'displayName',en:'Display name',yue:'顯示名稱',purpose:['Rename local workspace branding and titles, not the profile person. Empty names use Jackson Chung.','更改本機工作區品牌同標題，唔改個人身份。空白會顯示 Jackson Chung。']},
 {key:'reducedMotion',en:'Reduced motion',yue:'減少動態',purpose:['Request reduced interface motion. Device accessibility and low stimulation may also reduce it.','要求減少介面動態。裝置無障礙設定同低刺激亦可能減少動態。']},
 {key:'narration',en:'Narration',yue:'旁白',purpose:['Opt into spoken events using browser voices. Speech starts only after this choice and suitable voice availability.','自行啟用瀏覽器聲線朗讀事件，須有合適聲線先可播放。']},
 {key:'narrationLanguage',en:'Narration language',yue:'旁白語言',purpose:['Choose spoken English, Cantonese or both in order. The presentation restriction forces spoken English.','選擇英文、廣東話或依次兩者。顯示限制會強制英文旁白。']},
 {key:'voiceEn',en:'English voice',yue:'英文聲線',purpose:['Choose an available English browser voice. Empty means automatic; unavailable saved voices fall back visibly.','選擇瀏覽器英文聲線。空白代表自動；儲存聲線不可用時會顯示替代狀態。']},
 {key:'voiceYue',en:'Cantonese voice',yue:'廣東話聲線',purpose:['Choose a Cantonese browser voice independently. Empty means automatic; voice availability depends on the device.','獨立選擇廣東話聲線。空白代表自動，聲線供應按裝置而定。']},
 {key:'rate',en:'Speech rate',yue:'朗讀速度',purpose:['Set spoken-event speed from 0.5 to 2. Browser voice support determines the actual sound.','設定零點五至二倍朗讀速度，實際聲音按瀏覽器聲線支援而定。']},
 {key:'pitch',en:'Speech pitch',yue:'朗讀音高',purpose:['Request speech pitch from 0 to 2. Some voices may ignore pitch adjustments.','要求零至二音高，部分聲線可能唔支援調整。']},
 {key:'focus',en:'Focus',yue:'專注',purpose:['Keep the chosen focus destination prominent. Choose that destination in the workspace bar.','突出自行選擇嘅專注位置，可喺工作區列選擇位置。']},
 {key:'lowStimulation',en:'Low stimulation',yue:'低刺激',purpose:['Reduce colour intensity and motion without rewriting saved appearance choices.','減少色彩強度同動態，唔改寫儲存顯示偏好。']},
 {key:'timeAwareness',en:'Time awareness',yue:'時間提示',purpose:['Show elapsed session and unchanged time. These wall-clock durations do not measure work.','顯示本次開啟同未變更經過時間，唔代表工作量。']},
 {key:'oneThing',en:'One thing at a time',yue:'逐件處理',purpose:['Show the locally chosen next action. Its text is separate from settings and excluded from their export.','顯示本機自行選擇嘅下一步，文字獨立於設定，唔加入設定匯出。']},
 {key:'momentum',en:'Momentum',yue:'保持步調',purpose:['Offer a non-blocking prompt after observed inactivity, with dismissal and snooze.','觀察到一段時間冇操作後提供非阻擋提示，可以關閉或延後。']}
];
export const auxiliaryExplanations={
 personalWords:['Personal wording file','個人用字檔案','Load only a chosen validated local file. Clear removes its private cache and restores original wording. No file is shipped.','只載入自行選擇並驗證嘅本機檔案。清除會移除私人快取並恢復原有用字，唔會隨附檔案。'],
 screenReaderPause:['Screen-reader pause','螢幕閱讀器暫停','Pause narration for this session without changing the saved opt-in. Default: off. Browser detection is not reliable.','只暫停此工作階段旁白，唔改儲存選擇。預設關閉，瀏覽器偵測並唔可靠。'],
 previewVoice:['Voice preview','試聽聲線','Play the fixed preview using the actual narration controls; speech availability and pause rules still apply. No stored value.','按實際旁白選項播放固定試聽，聲線供應同暫停規則仍適用。冇儲存值。'],
 stopSpeech:['Stop speech','停止語音','Cancel owned speech now without disabling future narration. No stored value.','即時取消本程式語音，唔停用日後旁白。冇儲存值。'],
 exportSettings:['Export settings','匯出設定','Download current settings and bounded history. Private wording and next-action text are omitted. No configuration default.','下載現時設定同有上限歷史，唔包括私人用字同下一步文字。唔屬設定預設值。'],
 importSettings:['Import settings','匯入設定','Validate the entire selected versioned settings object before applying it. Invalid input keeps current settings. No default file.','整份驗證自行選擇嘅版本化設定後先套用。無效輸入會保留現時設定，冇預設檔案。'],
 resetSettings:['Reset settings','重設設定','Restore compiled settings values, creating a revision only when values change. This does not clear private wording or separate records.','還原內建設定值，值有改變先新增版本。唔會清除私人用字或獨立記錄。'],
 restoreHistory:['Restore history','還原歷史','Apply a reviewed revision as current settings and append a new revision when changed. No revision is selected by default.','將檢視過嘅版本套用為現時設定，變更時新增版本，預設冇選取版本。']
} as const;
export function formatSettingValue(value:unknown){if(typeof value==='boolean')return value?t('On','開啟'):t('Off','關閉');if(value==='')return t('Empty string','空字串');return String(value);}
export function explainSetting(key:keyof Settings,date=new Date()){
 const entry=settingExplanations.find(entry=>entry.key===key);if(!entry)throw Error('Missing setting explanation: '+key);
 const base=getState(),provenance=getSettingsProvenance();const rules=getSchedules().filter(rule=>scheduleMatches(rule,date));const winner=appliedScheduleFields.includes(key as any)?rules.filter(rule=>key in rule.patch).at(-1):undefined;
 let effective=winner?winner.patch[key]:base[key];let source=winner?t('Temporary rule: ','暫時規則：')+winner.label:t('Current base setting','現時基礎設定');if(getSchoolState().enabled&&(key==='locale'||key==='narrationLanguage')){effective='en';source=t('Active presentation restriction','現時顯示限制');}
 return {entry,defaultValue:defaults[key],current:base[key],effective,effectiveSource:source,currentSource:provenance.currentSource,persistence:provenance.persistence,persisted:provenance.persisted?.[key],hasPersisted:!!provenance.persisted,historyWrite:provenance.historyWrite};
}

export function settingsSearchItems(){const school=getSchoolState().enabled;const groups:Array<Array<keyof Settings>>=[school?[]:['locale','funnyEn','funnyYue','emojis'],['theme','density','font','fontSize','seed','displayName','reducedMotion'],school?['narration','voiceEn','rate','pitch']:['narration','narrationLanguage','voiceEn','voiceYue','rate','pitch'],['focus','lowStimulation','timeAwareness','oneThing','momentum'],[]];const auxiliary:Array<Array<keyof typeof auxiliaryExplanations>>=[school?[]:['personalWords'],[],['screenReaderPause','previewVoice','stopSpeech'],[],['exportSettings','importSettings','resetSettings','restoreHistory']];return groups.map((keys,index)=>[...keys.map(key=>{const info=explainSetting(key);return [t(info.entry.en,info.entry.yue),t(...info.entry.purpose),t('Shipped default','原有預設值'),formatSettingValue(info.defaultValue),t('Current base value','現時基礎值'),formatSettingValue(info.current),t('Effective setting input','有效設定輸入'),formatSettingValue(info.effective),info.effectiveSource].join(' ');}),...auxiliary[index].map(key=>{const item=auxiliaryExplanations[key];return t(item[0],item[1])+' '+t(item[2],item[3]);})].join(' '));}
