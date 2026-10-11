# PROMPTURE Web App v1.1 — တပ်ဆင်နည်း 🌸

## အမြန်စတင်နည်း (၃ ဆင့်)

### ၁️⃣ ဖိုင်ဖြည် + ဖွင့်
- ဒီ zip ကို ဖိုင်ဖြည်ပါ → `index.html` ကို double-click (သို့) browser မှာ ဖွင့်ပါ။
- Phone မှာဆို: ဖိုင်တွေကို phone ထဲကူး → Chrome မှာ `index.html` ဖွင့်။

### ၂️⃣ Gemini API key ထည့်
1. App ထဲက **⚙** (အပေါ်ညာ) ကို နှိပ်ပါ
2. **Gemini API key** နေရာမှာ ကိုယ့် key ကို paste လုပ်ပါ → **Key စမ်း** ကို နှိပ်ပါ
3. "✅ Key အလုပ်လုပ်တယ်" ပြရင် **ပြီးပြီ** ကို နှိပ်ပါ
- Key က ဒီ browser ထဲမှာပဲ သိမ်းထားတယ် — Google ဆီကိုပဲ သွားတယ်, ဘယ်သူ့ဆီမှ မရောက်ဘူး။
- Key မရှိသေးရင်: [Google AI Studio](https://aistudio.google.com/apikey) မှာ အခမဲ့ ယူလို့ရတယ်။

### ၃️⃣ စသုံးပါ (v1.1 အသစ်)
1. **☰** နဲ့ sidebar ဖွင့်/ပိတ် — phone မှာဆို ဘေးက ဆွဲထုတ်တဲ့ drawer ဖြစ်မယ်
2. **Slot** တွေမှာ ပုံခွဲတင်: 👤 Model · 👗 အဝတ် · 🧍 Pose · 💄 မိတ်ကပ် · 📍 နေရာ · 🪑 ပရိဘောဂ (+ နှိပ်ပြီး တင်)
3. အပေါ်က အဆင့် **1→2→3→4** ကို နှိပ် (သို့) **🚀** နှိပ် → layer map → နေရာ ၁၀ ခု + မိတ်ကပ် ၅ ခု ကတ်
4. ကတ် ၂ ခု ရွေးပြီးရင် **"အပြီးသတ် prompt ဆောက်မယ် →"** ခလုတ် ပေါ်မယ် → နှိပ် → copy-ready prompt ၂ ခု ရမယ်
- စာရိုက်တဲ့ box က အကြီးဖြစ်သွားပြီ — ရှည်လဲ auto-ကြီးလာမယ် ✍️

## ✨ အင်္ဂါရပ်များ
- **အသင့်သုံး command ၂၀** — နှိပ်ရုံပဲ (စာရိုက်စရာမလို)
- **မြန်မာ / English** — အပေါ်က toggle နဲ့ ပြောင်း
- **Mobile + Desktop** — နှစ်မျိုးလုံး အဆင်ပြေ
- **PWA** — GitHub Pages / Netlify မှာ free တင်ပြီး phone မှာ app လို install လုပ်လို့ရ

## 📁 ဖိုင်များ
| ဖိုင် | အကြောင်း |
|---|---|
| `index.html` | App အဓိက (ဒါကို ဖွင့်) |
| `styles.css` | Premium dark-luxury UI |
| `app.js` | App logic |
| `knowledge.js` | PROMPTURE knowledge (canonical final) |
| `manifest.json` | PWA install အတွက် |

## ⚠️ မှတ်ချက်
- ဒီ app က **prompt ပဲ ရေးတယ်** — ပုံမထုတ်ဘူး (PROMPTURE STUDIO က ပုံထုတ်တာ)။
- Internet လိုတယ် (Gemini API ခေါ်ဖို့)။
- API သုံးတာ Google ရဲ့ free tier / billing အတိုင်း ကုန်ကျမယ်။
