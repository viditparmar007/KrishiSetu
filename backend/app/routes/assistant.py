from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.models.user import User

router = APIRouter(prefix="/api/v1/assistant", tags=["AI Assistant"])


class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    answer: str
    suggestions: list[str] = []


@router.post("/query", response_model=QueryResponse)
def query_assistant(
    payload: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = payload.query.strip().lower()

    # Load farmer context
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    farms = db.query(Farm).filter(Farm.farmer_id == farmer.id).all() if farmer else []
    crops = []
    if farms:
        farm_ids = [f.id for f in farms]
        crops = db.query(Crop).filter(Crop.farm_id.in_(farm_ids)).all()

    crop_names = [c.crop_name for c in crops if c.crop_name]
    main_crop = crop_names[0] if crop_names else "Gehun (Wheat)"
    location_name = f"{farmer.village}, {farmer.district}" if farmer else "Saharanpur"

    # Match queries
    # 1. Irrigation / Paani
    if any(k in q for k in ["paani", "pani", "water", "irrigation", "sinchai", "sichai"]):
        if any(k in q for k in ["wheat", "gehun", "gehu"]) or "gehun" in main_crop.lower():
            answer = (
                f"🌾 **गेहूं में सिंचाई सलाह ({location_name}):**\n\n"
                "1. **पहली सिंचाई (क्राउन रूट इनिशिएशन - CRI):** बुवाई के 20 से 25 दिन बाद अनिवार्य है। यह सबसे महत्वपूर्ण सिंचाई है।\n"
                "2. **दूसरी सिंचाई (कल्ले फूटते समय):** बुवाई के 40-45 दिन बाद।\n"
                "3. **तीसरी सिंचाई (गांठे बनते समय):** बुवाई के 60-65 दिन बाद।\n"
                "4. **चौथी सिंचाई (फूल आने पर):** 80-85 दिन बाद।\n"
                "⚠️ **सावधानी:** पहली सिंचाई के बाद खेत में यूरिया (Top dressing) 30-35 किग्रा प्रति एकड़ बखेरें।"
            )
        else:
            answer = (
                f"💧 **सिंचाई सलाह ({main_crop}):**\n\n"
                "• हल्की एवं नियमित सिंचाई करें। खेत में जलभराव न होने दें।\n"
                "• शाम के समय या सुबह जल्दी सिंचाई करना वाष्पीकरण को रोकता है और फसल को ठंडक देता है।\n"
                "• ड्रिप या स्प्रिंकलर प्रणाली अपनाने से 40% तक पानी की बचत होती है।"
            )
        suggestions = ["यूरिया कब डालें?", "पीला रतुआ का इलाज क्या है?", "सहारनपुर मंडी भाव क्या है?"]

    # 2. Fertilizer / Urea / Khad / NPK
    elif any(k in q for k in ["khad", "urea", "fertilizer", "dap", "npk", "poshan", "potash"]):
        answer = (
            f"🌱 **संतुलित उर्वरक प्रबंधन ({main_crop}):**\n\n"
            "• **बुवाई के समय (Basal):** 1 बैग DAP (50 किग्रा) + 20 किग्रा MOP (पोटाश) प्रति एकड़।\n"
            "• **पहली सिंचाई पर (Top Dressing):** 35-40 किग्रा नीम लेपित यूरिया + 5 किग्रा जिंक सल्फेट (21%) प्रति एकड़।\n"
            "• **दूसरी सिंचाई पर:** 30 किग्रा यूरिया प्रति एकड़।\n"
            "💡 **टिप:** यदि पत्तियों में पीलापन दिखे, तो 2% यूरिया (20 ग्राम प्रति लीटर पानी) का पर्णीय छिड़काव (foliar spray) करें।"
        )
        suggestions = ["गेहूं में पहला पानी कब दें?", "सरसों में माहू का उपचार", "मंडी में स्लॉट कैसे बुक करें?"]

    # 3. Pest / Disease / Keet / Rog / Spray
    elif any(k in q for k in ["rog", "keet", "spray", "bimari", "disease", "pest", "fungus", "ratua", "rust", "mahu", "keeda"]):
        answer = (
            f"🛡️ **रोग एवं कीट सुरक्षा परामर्श ({location_name}):**\n\n"
            "1. **गेहूं का पीला रतुआ (Yellow Rust):** यदि पत्तियों पर पीले रंग की धारियां/पाउडर दिखे, तो तुरंत **प्रोपिकोनाज़ोल 25% EC (Tilt)** @ 1 मिली प्रति लीटर पानी में मिलाकर 200 लीटर पानी प्रति एकड़ छिड़कें।\n"
            "2. **सरसों का माहू (Aphids):** **इमिडाक्लोप्रिड 17.8 SL** @ 1 मिली प्रति 3 लीटर पानी में छिड़काव करें।\n"
            "3. **छिड़काव नियम:** तेज धूप या हवा में छिड़काव न करें। मौसम साफ रहने पर ही स्प्रे करें।"
        )
        suggestions = ["मौसम का हाल क्या है?", "खाद की सही मात्रा", "कृषि योजनाएं"]

    # 4. Mandi Bhav / MSP / Price / Bhaav
    elif any(k in q for k in ["bhav", "rate", "price", "mandi", "msp", "bhaav", "kimat"]):
        answer = (
            f"💰 **नजदीकी मंडी भाव एवं समर्थन मूल्य ({location_name}):**\n\n"
            "• **गेहूं (Wheat MSP):** ₹2,425 / क्विंटल (सरकार द्वारा निर्धारित न्यूनतम समर्थन मूल्य)\n"
            "• **धान (Paddy Common MSP):** ₹2,300 / क्विंटल\n"
            "• **सरसों (Mustard):** ₹5,100 - ₹5,450 / क्विंटल (स्थानीय मंडी भाव)\n\n"
            "📍 **निकटतम खरीद केंद्र:**\n"
            "1. Mandi Samiti Saharanpur - स्लॉट उपलब्ध हैं\n"
            "2. Mohra Krishi Procurement Centre - 0.5 किमी दूरी पर\n"
            "👉 *'Find Centre' सेक्शन में जाकर आज ही अपना डिजिटल टोकन बुक करें!*"
        )
        suggestions = ["स्लॉट कैसे बुक करें?", "गेहूं में पहला पानी कब दें?", "पीएम किसान योजना"]

    # 5. Booking / Slot / Token / Queue / Centre
    elif any(k in q for k in ["centre", "center", "slot", "token", "queue", "line", "booking", "kharid"]):
        answer = (
            f"🎫 **कृषिसेतु खरीद केंद्र स्लॉट व टोकन जानकारी:**\n\n"
            "1. **स्लॉट बुक करें:** डैशबोर्ड पर **'Find Centre'** पर क्लिक करें, नज़दीकी केंद्र चुनें और मनपसंद तारीख/समय चुनें।\n"
            "2. **डिजिटल टोकन:** बुकिंग होते ही आपको पारदर्शी डिजिटल टोकन नंबर मिलेगा।\n"
            "3. **लाइव लाइन ट्रैकिंग:** मंडी रवाना होने से पहले 'Live Queue' में देखें कि आपसे आगे कितने किसान हैं। इससे मंडी गेट पर घंटों लाइन में नहीं लगना पड़ेगा!"
        )
        suggestions = ["मंडी भाव क्या है?", "मौसम अलर्ट", "पासवर्ड कैसे बदलें?"]

    # 6. Weather / Mausam
    elif any(k in q for k in ["mausam", "weather", "barish", "rain", "temperature", "hawa", "dhoop"]):
        answer = (
            f"🌦️ **मौसम पूर्वानुमान एवं कृषि कार्य ({location_name}):**\n\n"
            "• **तापमान:** 24°C - 28°C के बीच अनुकूल स्थिति।\n"
            "• **आर्द्रता:** सामान्य, वर्षा की संभावना कम है।\n"
            "• **सलाह:** मौसम खुला रहने से गेहूं व सरसों में सिंचाई एवं आवश्यक कीटनाशक छिड़काव के लिए आज का दिन उपयुक्त है। शाम को हल्की सिंचाई कर सकते हैं।"
        )
        suggestions = ["सिंचाई कब करें?", "खाद की सही मात्रा", "मंडी भाव"]

    # 7. Government Schemes / Subsidy / Yojana
    elif any(k in q for k in ["yojana", "scheme", "subsidy", "pm kisan", "kcc", "fasal bima", "bima"]):
        answer = (
            f"🏛️ **प्रमुख सरकारी कृषि योजनाएं:**\n\n"
            "1. **PM-KISAN सम्मान निधि:** किसानों को ₹6,000 प्रति वर्ष (₹2,000 की 3 किस्तों में) सीधे बैंक खाते में।\n"
            "2. **प्रधानमंत्री फसल बीमा योजना (PMFBY):** प्राकृतिक आपदाओं से फसल नुकसान पर व्यापक बीमा कवरेज (रबी 1.5%, खरीफ 2% प्रीमियम)।\n"
            "3. **किसान क्रेडिट कार्ड (KCC):** समय पर भुगतान करने पर मात्र 4% ब्याज दर पर ₹3 लाख तक का कृषि ऋण।\n"
            "4. **PM-KUSUM सोलर पंप:** 60% तक सरकारी अनुदान पर सोलर ट्यूबवेल स्थापना।"
        )
        suggestions = ["गेहूं का समर्थन मूल्य (MSP)?", "मंडी स्लॉट कैसे बुक करें?", "खाद व उर्वरक"]

    # Default general intelligent response
    else:
        answer = (
            f"🌾 **नमस्ते किसान भाई! मैं कृषिसेतु AI सहायक हूँ।**\n\n"
            f"आपकी पंजीकृत फसल: **{main_crop}** ({location_name})\n\n"
            "मैं आपकी निम्न विषयों में तुरंत मदद कर सकता हूँ:\n"
            "• 💧 फसल में सिंचाई एवं पानी का सही समय\n"
            "• 🌱 यूरिया, DAP, जिंक और संतुलित खाद प्रबंधन\n"
            "• 🛡️ पीला रतुआ, माहू व कीट-रोगों का उपचार एवं दवा\n"
            "• 💰 आज का मंडी भाव एवं MSP न्यूनतम समर्थन मूल्य\n"
            "• 🎫 खरीद केंद्र स्लॉट बुकिंग व लाइव लाइन टोकन\n"
            "• 🏛️ PM किसान, फसल बीमा एवं सरकारी योजनाएं\n\n"
            "कृपया अपना सवाल पूछें!"
        )
        suggestions = [
            "🌾 गेहूं में पहला पानी कब दें?",
            "💰 आज का मंडी भाव क्या है?",
            "🛡️ फसल में पीला रतुआ का इलाज",
            "🎫 खरीद केंद्र पर स्लॉट कैसे बुक करें?",
        ]

    return QueryResponse(answer=answer, suggestions=suggestions)

