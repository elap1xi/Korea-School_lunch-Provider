var posTagger = require('wink-pos-tagger');
var tagger = posTagger();
var { EmbedBuilder } = require('discord.js');
var func = require('./function.js');

async function Lunch(content){
    var DTE = new Date();
    var contentArr = content.split(" ");
    var length = contentArr.length;

    // Detect School Name
    var sch_name;
    for(i=0; i<length; i++){
        var contentArr_Dok = contentArr[i];
        if(contentArr_Dok.endsWith("초")||contentArr_Dok.endsWith("고")){
            contentArr_Dok = contentArr_Dok+'등학교';
        } else if(contentArr_Dok.endsWith("중")){
            contentArr_Dok = contentArr_Dok+'학교';
        } else {
            contentArr_Dok = "NOT_SCHNAME-01";
        }
        if(contentArr_Dok!=="NOT_SCHNAME-01"){
            var Translated_SCH_name = String( await func.PAPAGO_translate(contentArr_Dok,'en'));
            Tag_Arr = tagger.tagSentence(Translated_SCH_name);
            leng = Tag_Arr.length;
            for(i=0; i<leng; i++){
                val = Tag_Arr[i].value;
                pos = Tag_Arr[i].pos;
                // console.log(`{val : ${val}, pos : ${pos} }`);
                if(pos=='NN'||pos=='NNS'||pos=='NNP'||pos=='NNPS'||pos=='.'||pos=='POS'){
                    sch_name = contentArr_Dok;
                }
            }
        } else {
            continue;
        }
    }
    var index_check_NUM;
    if(sch_name===undefined){
        sch_name_DIR = await func.Lunch_output(author);
        if(sch_name_DIR===undefined){
            message.channel.send("등록되어있는 학교가 없습니다");
            return;
        } else {
            sch_name = String(sch_name_DIR);
            sch_index = await func.Lunch_output_index(author);
            index_check_NUM += 1;
        }
    }
    // Get Date
    var Translated_CONTENT = String( await func.PAPAGO_translate(content,'en'));
    Tag_Arr = tagger.tagSentence(Translated_CONTENT);
    leng = Tag_Arr.length;
    Day_ARR = [];
    for(i=0; i<leng; i++){
        val = Tag_Arr[i].value;
        pos = Tag_Arr[i].pos;
        if(pos=='JJ'){
            dy = val.replace(/st/gi,''); dy = dy.replace(/nd/gi,''); dy = dy.replace(/rd/gi,''); dy = dy.replace(/th/gi,'');
            Day_ARR.push(dy);
        }
    }

    Detected_day = String(Day_ARR.join(' '));
    var Date_calc = await func.POS_check_Lunch_Date(Translated_CONTENT, content);
    if(Date_calc==0){
        if(func.POS_check_Lunch_Daterl(Translated_CONTENT, 0)=="RST"){
            var Year = String(DTE.getFullYear());
            var Month_d = String(func.POS_check_Lunch_Daterl(Translated_CONTENT, 1));
            var Daterl = `${Year} ${Month_d} ${Detected_day}`;
            var Date_calc = func.day__calc(Daterl);
        } else { 
            var Year = String(DTE.getFullYear());
            var Month_d = String(DTE.getMonth()+1);
            var Detected_day = String(DTE.getDate());
            var Daterl = `${Year} ${Month_d} ${Detected_day}`;
        }
    } else {
        var Daterl = await func.CHG_Date(Date_calc);
        var Year = (Daterl.split(" "))[0];
        var Month_d = (Daterl.split(" "))[1];
        var Detected_day = (Daterl.split(" "))[2];
    }
    
    if(Month_d.length==1){
        Month = `0${Month_d}`;
    } else {
        Month = Month_d;
    }
    if(Detected_day.length==1){
        Day = `0${Detected_day}`;
    } else {
        Day = Detected_day;
    }
    var Date_url = `${Year}${Month}${Day}`;
    var Date_frmt = `${Year}/${Month_d}/${Detected_day}`;
    // console.log(`Detected Date : ${Date_frmt}`);
    // console.log(`Date_calc : ${Date_calc}`);

    var PLA = new Date(`${Year}-${Month}-${Day}`);
    if(PLA.getDay()==0||PLA.getDay()==6){
        async function Lunch_weekend(date) {
            const lch = new EmbedBuilder()
            .setColor(0xffffff).setTitle(`주말엔 급식정보가 없어요!`)
            .setDescription(`${date} (은) 주말이에요!`)
            await message.channel.send({ embeds: [lch]});
        }
        Lunch_weekend(Date_frmt);
        return;
    }

    if(Date_calc>20){
        message.channel.send("20일 이내의 급식 데이터만 조회 가능합니다.");
        return;
    } else if(Date_calc<-2){
        message.channel.send("과거 2일 이내의 급식 데이터만 조회 가능합니다.");
        return;
    }
    // End -- (Detect Date)
    // Get School Code
    sch_codeLeng = await func.school_code(sch_name, neis_key)
    .catch(error => { message.channel.send(`알 수 없는 에러가 발생했어요\n${error}`); });
    ps_json = (sch_codeLeng.schoolInfo[1].row);
    ps_json_leng = ps_json.length;
    // console.log(ps_json);

    // Discord Embed Funtion
    async function res(school_name, menu, date) {
        lch_Arr = menu.split("$$");
        var lch_menu = lch_Arr[0];
        var lch_cal = lch_Arr[1];
        const lch = new EmbedBuilder()
        .setColor(0xffffff).setTitle(`${school_name} 급식`)
        .setDescription(`${lch_menu}`)
        .setFooter({text: `식단 날짜 : ${date} | 총 칼로리 : ${lch_cal}`})
        await message.channel.send({ embeds: [lch]});
    }
    async function res_nah(school_name, date_frmt) {
        const lch_nah = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle(`급식 정보를 찾을 수 없어요!`)
        .setDescription("급식이 아직 등록되지 않았을 수 있어요!\n물론 오류가 났을수도 있겠지만요 👀")
        .setTimestamp()
        .setFooter({text: `만약 제가 날짜, 학교 등을 잘못 감지한것 같다면 /오류신고 로 알려주세요! || \n<감지된 학교 : ${school_name} / 날짜 : ${date_frmt}>`})
        await message.channel.send({ embeds: [lch_nah]});
        return;
    }

    // Get Lunch Menu
    if(ps_json_leng>1){
        if(index_check_NUM==1){
            var ATPT_OFCDC_SC_CODE = ps_json[index].ATPT_OFCDC_SC_CODE;
            var SD_SCHUL_CODE = ps_json[index].SD_SCHUL_CODE;
            lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url)
            .catch(error => { 
                res_nah(sch_name, Date_frmt); 
                return "INFO-0100"; 
            });
            if(lch_menu==="INFO-200"){
                res_nah(sch_name, Date_frmt);
                return;
            } else if(lch_menu==="INFO-0100"){
                return;
            } else {
                res(sch_name, lch_menu, Date_frmt);
            }
        } 
        
        else {
            city_arr = [];
            for(i=0; ps_json_leng>i; i++){
                city_arr.push(`${i+1}. **${ps_json[i].LCTN_SC_NM}**`);
            }
            city_arr = city_arr.join("\n")

            const cty = new EmbedBuilder()
                .setColor(0xffffff).setTitle(`어느지역의 ${sch_name} 인지 알려주세요!`)
                .addFields(
                    { name: "목록", value: city_arr, inline: true },
                )
                .setFooter({ text: '반응이 없을경우, 이 메세지는 1분후에 자동 삭제될거에요.'});
            const msg = await message.channel.send({embeds : [cty], fetchReply: true});
            
            // Event_Reaction Clicked handler funtion
            async function handleCollect_01(reaction, user) {
                if(reaction.emoji.name==='1️⃣'){
                    await msg.delete();
                    var ATPT_OFCDC_SC_CODE = ps_json[0].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[0].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                } else if(reaction.emoji.name==='2️⃣'){
                    await msg.delete()
                    var ATPT_OFCDC_SC_CODE = ps_json[1].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[1].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                }
            }
            
            async function handleCollect_012(reaction, user){
                if(reaction.emoji.name==='1️⃣'){
                    await msg.delete();
                    var ATPT_OFCDC_SC_CODE = ps_json[0].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[0].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                } else if(reaction.emoji.name==='2️⃣'){
                    await msg.delete()
                    var ATPT_OFCDC_SC_CODE = ps_json[1].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[1].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                } else if(reaction.emoji.name==='3️⃣'){
                    await msg.delete()
                    var ATPT_OFCDC_SC_CODE = ps_json[2].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[2].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                }
            }

            async function handleCollect_0123(reaction, user){
                if(reaction.emoji.name==='1️⃣'){
                    await msg.delete();
                    var ATPT_OFCDC_SC_CODE = ps_json[0].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[0].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                } else if(reaction.emoji.name==='2️⃣'){
                    await msg.delete()
                    var ATPT_OFCDC_SC_CODE = ps_json[1].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[1].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; });
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                } else if(reaction.emoji.name==='3️⃣'){
                    await msg.delete()
                    var ATPT_OFCDC_SC_CODE = ps_json[2].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[2].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; })
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                } else if(reaction.emoji.name==='4️⃣'){
                    await msg.delete()
                    var ATPT_OFCDC_SC_CODE = ps_json[3].ATPT_OFCDC_SC_CODE;
                    var SD_SCHUL_CODE = ps_json[3].SD_SCHUL_CODE;
                    lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url).catch(error => { res_nah(sch_name, Date_frmt); 
                        return "INFO-0100"; })
                    //console.log(menu);
                    if(lch_menu==="INFO-200"){
                        res_nah(sch_name, Date_frmt);
                        return;
                    } else if(lch_menu==="INFO-0100"){
                        return;
                    } else {
                        res(sch_name, lch_menu, Date_frmt);
                    }
                }
            }

            // Get Reaction and Response
            if(ps_json_leng==2){
                await msg.react('1️⃣').then(() => msg.react('2️⃣'));
                const collector = msg.createReactionCollector({ max: 1, time: 60000 });
            
                collector.on('collect', handleCollect_01);
            
                collector.on('end', async collected => {
                    if(!msg.delete){
                        await msg.delete()
                        message.channel.send("시간이 초과되었습니다.");
                    }
                    return;
                });
            }
            
            else if(ps_json_leng==3){
                await msg.react('1️⃣').then(() => msg.react('2️⃣')).then(() => msg.react('3️⃣'));
                const collector = msg.createReactionCollector({ max: 1, time: 60000 });
            
                collector.on('collect', handleCollect_012);
            
                collector.on('end', async collected => {
                    if(!msg.delete){
                        await msg.delete()
                        message.channel.send("시간이 초과되었습니다.");
                    }
                    return;
                });
            }
            
            else if(ps_json_leng==4){
                await msg.react('1️⃣').then(() => msg.react('2️⃣')).then(() => msg.react('3️⃣')).then(() => msg.react('4️⃣'));
                const collector = msg.createReactionCollector({ max: 1, time: 60000 });
            
                collector.on('collect', handleCollect_0123);
            
                collector.on('end', async collected => {
                    if(!msg.delete){
                        await msg.delete()
                        message.channel.send("시간이 초과되었습니다.");
                    }
                    return;
                });
            }
        }
    }

    if(ps_json_leng==1){
        var ATPT_OFCDC_SC_CODE = ps_json[0].ATPT_OFCDC_SC_CODE;
        var SD_SCHUL_CODE = ps_json[0].SD_SCHUL_CODE;
        lch_menu = await func.school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, Date_url)
        .catch(error => { 
            res_nah(sch_name, Date_frmt); 
            return "INFO-0100"; 
        });
        if(lch_menu==="INFO-200"){
            res_nah(sch_name, Date_frmt);
            return;
        } else if(lch_menu==="INFO-0100"){
            return;
        } else {
            res(sch_name, lch_menu, Date_frmt);
        }
    }
}
