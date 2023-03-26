const fs = require('node:fs');
var posTagger = require('wink-pos-tagger');
var tagger = posTagger();
var lch_data = fs.readFileSync(__dirname+`/lch.json`);
var lchObject = JSON.parse(lch_data);

module.exports = {
    Lunch_output(id){
      function getValue(code) {
        return lchObject.filter(
          (lchObject) => lchObject["ID"] == code
        );
      }
      try{
        var found = getValue(id);
        return found[0].School_name;
      } catch {
        return undefined;
      }
    },
    Lunch_output_index(id){
      function getValue(code) {
        return lchObject.filter(
          (lchObject) => lchObject["ID"] == code
        );
      }
      try{
        var found = getValue(id);
        return found[0].index;
      } catch {
        return undefined;
      }
    },
    async PAPAGO_translate(value, target){
      async function trpago(value, target){
        let json = fetch(`https://playentry.org/api/expansionBlock/papago/translate/n2mt?text=${value}&target=${target}`)
        .then(res => res.json())
        .catch(error => { console.log(error); });
        return json;
      }
      json = await trpago(value, target);
      TranslatedText = String(json.translatedText);
      //console.log("NTR_Function : ",TranslatedText);
      if(TranslatedText==='undefined'){
        return 10001;
      } else {
        return TranslatedText;
      }
    },
    // School parse
    async school_code(school_name, neis_key){
      async function code(value, neis_key){
        var code = fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&KEY=${neis_key}&pSize=100&SCHUL_NM=${value}`)
        .then(res => res.json())
        .catch(error => {console.log(error);});
        return code;
      }
      // console.log(`https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&KEY=${neis_key}&pSize=100&SCHUL_NM=${school_name}`);
      json = await code(school_name, neis_key);
      return json;
    },
    async school_menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, MLSV_YMD){
      async function menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, MLSV_YMD){
        var code = fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&KEY=${neis_key}&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${MLSV_YMD}`)
        .then(res => res.json())
        .catch(error => {console.log(error);});
        return code;
      }
      // console.log(`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&KEY=${neis_key}&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${MLSV_YMD}`);
      json = await menu(neis_key, ATPT_OFCDC_SC_CODE, SD_SCHUL_CODE, MLSV_YMD);
      try{
        if((json.mealServiceDietInfo[1].row).length>1){
          menu_row = json.mealServiceDietInfo[1].row[1].DDISH_NM;
        } else {
          menu_row = json.mealServiceDietInfo[1].row[0].DDISH_NM;
        }
          menu_row = String(menu_row).replace(/[<br/>]/gi,'');
          menu_row = String(menu_row).replace(/[(.*[0-9)]/gi,'');
          menu_row = String(menu_row).replace(/자율/gi,' (자율)');
          menu_row = String(menu_row).replace(/  /gi,'\n');
          return menu_row;
      } catch {
        err_code = json.RESULT.CODE;
        return err_code;
      }
    },
    POS_check_Lunch_schoolName(sot){
      val_UpperCase = [];
      //console.log(sot);
      for(i=0; i<sot.length; i++){
        val = sot[i].value;
        pos = sot[i].pos;
        val_st = val.charAt(0);
        if(this.chk_pos$val(pos, 1)){
          if(val_st===val_st.toUpperCase()){
            if(this.chk_pos$val(pos, 2)){
              if(this.chk_pos$val(val, 3)){
                val_UpperCase.push(val);
              }
            }
          }
        }
      }
      schoolname_eng = val_UpperCase.join(" ");
      return schoolname_eng;
    },
    POS_check_Lunch_schoolName_ends(contentArr, i, k){
      sclname = contentArr[i];
      sclname = sclname.slice(0,k);
      sclname = sclname+"고등학교";
      contentArr[i] = sclname;
      return contentArr;
    },
    day__calc(Daterl){
      var year = new Date().getFullYear();
      var month = new Date().getMonth()+1;
      var day = new Date().getDate();
      Date_ar = Daterl.split(" ");
      var yearl = Date_ar[0];
      var monthl = Date_ar[1];
      var dayl = Date_ar[2];

      function chk_d(dy, dyl){
        if(dy>dyl){
            return 'past';
        } else if(dy<dyl){
            return 'future';
        } else {
            return 'current';
        }
      }
    
      function check_date(year, yearl, month, monthl, day, dayl){
        var chk_yr = chk_d(year, yearl);
        var chk_mn = chk_d(month, monthl);
        var chk_dy = chk_d(day, dayl);
        if(chk_yr=='current'){
          if(chk_mn=='current'){
            if(chk_dy=='current'){
              return 0;
            } else if(chk_dy=='future'){
              return dayl - day;
            } else {
              return day - dayl;
            }
          } 
          else if(chk_mn=='future'){
            var mnl_tk = dayl;
            var mn_tk = mn_dy[`${month}`]-day;
            var mn_mnl_tk = mn_tk + mnl_tk;
            if(month+1<monthl){
              return 200;
            } else {
              return mn_mnl_tk;
            }
          }
          else if(chk_mn=='past'){
            var mnl_tk = mn_dy[`${monthl}`]-dayl;
            var mn_tk = day;
            var mn_mnl_tk = mn_tk + mnl_tk;
            if(month>monthl+1){
              return -200;
            } else {
              return mn_mnl_tk;
            }
          }
        }
        if(chk_yr=='future'){
          if(month==12 && monthl==1){
            var mn_mnl_tk = 31-day+dayl;
            return mn_mnl_tk;
          } else {
            return 200;
          }
        }
        if(chk_yr=='past'){
          if(month==1 && monthl==12){
            var mn_mnl_tk = 31+day-dayl;
            return mn_mnl_tk;
          } else {
            return -200;
          }
        }
      }
      var dok = check_date(year, yearl, month, monthl, day, dayl);
      return dok;
    },
    CHG_Date(RTNed_value){
      var aa = new Date(); 
		  var dy = aa.getDate()+RTNed_value;
      var mn = aa.getMonth()+1;
      var yr = aa.getFullYear();
      if(mn == 1||mn == 3||mn == 5||mn == 7||mn == 8||mn == 10||mn == 12){
        if(dy>31){
          mn = mn + 1;
          dy = dy - 31;
        }
      } else if(mn == 2){
        if(dy>28){
          mn = mn + 1;
          dy = dy - 28
        }
      } else {
        if(dy>30){
          mn = mn + 1;
          dy = dy - 30;
        }
      }
      if(dy==0){
        if( mn == 5||mn == 7||mn == 10||mn == 12 ){
          mn = mn - 1;
          dy = 30;
        } else if(mn == 3){
          mn = mn - 1;
          dy = 28;
        } else if(mn == 1){
          yr = yr - 1;
          mn = 12;
          dy = 31;
        } else {
          mn = mn - 1;
          dy = 31;
        }
      } else if(dy==-1){
        if( mn == 5||mn == 7||mn == 10||mn == 12 ){
          mn = mn - 1;
          dy = 29;
        } else if(mn == 3){
          mn = mn - 1;
          dy = 27;
        } else if(mn == 1){
          yr = yr - 1;
          mn = 12;
          dy = 30;
        } else {
          mn = mn - 1;
          dy = 30;
        }
      } else if(dy==-2){
        if( mn == 5||mn == 7||mn == 10||mn == 12 ){
          mn = mn - 1;
          dy = 28;
        } else if(mn == 3){
          mn = mn - 1;
          dy = 26;
        } else if(mn == 1){
          yr = yr - 1;
          mn = 12;
          dy = 29;
        } else {
          mn = mn - 1;
          dy = 29;
        }
      }
      datefor = `${yr} ${mn} ${dy}`;
      //console.log(`yr : ${yr}, mn : ${mn}, dy : ${dy}`);
      return datefor;
    },
    async POS_Test(content){
      var contentArr = content.split(" ");
      var lengARR = contentArr.length;
      var KOP_l = 0;
      //console.log(content);
      //console.log(lengARR);

      if(this.POS_Test_KR(content, 10)){
        //console.log("adw TRue")
        KOP_l = KOP_l + 1;
      }

      //console.log(`KOP : `,KOP_l);
      if(KOP_l>=1){
        return 10;
      } else {
        return 1;
      }

    },
    chk_pos$val(pova_value, dex){
      function check(value, dex){
        if(dex==1){
          chk_pnv = ['POS','.','VBZ',','];
        } else if(dex==2){
          chk_pnv = ['VB','POS','.','VBZ',',','WP','VBN','MD','CD','VBD','VBG','VBP','JJ'];
        } else if(dex==3){
          chk_pnv = ['Meal','meal','Meals','meals','lunch','Lunch', 'First','first','Second','second','Third','third','January','February','March','April','May','June','July','August','September','October','November','December'];
        }
        return chk_pnv.indexOf(value);
      }
      if(check(pova_value, dex)==-1){
        return true;
      } else {
        return false;
      }
    },
    POS_Test_KR(content, dex){
      if(dex==10){  
        var pos = content.indexOf('급식');
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==11){
        var pos = (content.toUpperCase()).indexOf("TOMORROW");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==12){
        var pos = (content.toUpperCase()).indexOf("YESTERDAY");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==13){
        var pos = content.indexOf("다다음주");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==14){
        var pos = (content.toUpperCase()).indexOf("THE DAY AFTER TOMORROW");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==15){
        var pos = (content.toUpperCase()).indexOf("THE DAY BEFORE YESTERDAY");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==16){
        var pos = (content.toUpperCase()).indexOf("NEXT WEEK");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==17){
        var pos = (content.toUpperCase()).indexOf("IN");
        if(pos===-1){ return false; }
        else{ 
          var ps = (content.toUpperCase()).indexOf("DAYS");
          if(ps===-1){ return false; }
          else{ return true; }
        }
      } else if(dex==18){
        var pos = (content.toUpperCase()).indexOf("DAYS AGO");
        if(pos===-1){ return false; }
        else{ return true; }
      } else if(dex==19){
        var pos = (content.toUpperCase()).indexOf("LAST WEEK");
        if(pos===-1){ return false; }
        else{ return true; }
      }
    },
    POS_check_Lunch_Date(content, content_kr){
      if( this.POS_Test_KR(content, 11)){
        if( this.POS_Test_KR(content, 14)){
          return 2;
        } else {
          return 1;
        }
      } else if( this.POS_Test_KR(content, 12)){
        if( this.POS_Test_KR(content, 15)){
          return -2;
        } else {
          return -1;
        }
      } else if( this.POS_Test_KR(content, 16)){
        if( this.POS_Test_KR(content_kr, 13)){
          if(content_kr.indexOf('다다다음주')===-1){
            return 14;
          } else {
            return 21; 
          }
        } else {
          return 7;
        }
      } else if( this.POS_Test_KR(content, 17)){
        var regexpCoordinates = /in+\s+\w+\s+days./g;
        dok = String(content.match(regexpCoordinates));
        dok = dok.replace(/in /gi,'');
        dok = dok.replace(/ days/gi,'');
        dok = dok.replace(/\./gi,'');
        //console.log(dok);
        if(num[dok]===undefined){
          //console.log(`NYM_dl : `+num[dok]);
          return Number(dok);
        } else {
          return num[dok];
        }
      } else if( this.POS_Test_KR(content, 18)){
        var regexpCoordinates = /\w+\s+days/g;
        dok = String(content.match(regexpCoordinates));
        dok = dok.replace(/ days/gi,'');
        dok = dok.replace(/\./gi,'');
        //console.log(dok);
        if(num[dok]===undefined){
          return -Number(dok);
        } else {
          return -Number(num[dok]);
        }
      } else if(this.POS_Test_KR(content, 19)){
        return -7;
      }
      else {
        return 0;
      }
    },
    POS_check_Lunch_Daterl(sentence, srt){
      var dok = 0;
      var Mo;
      for(i=0; i<12; i++){
        if(sentence.indexOf(month[i])!==-1){
          dok = dok + 1;
          Mo = month[i];
        }
      }
      if(dok>0){
        if(srt==0){
          return "RST";
        } else if(srt==1){
          return month_Num[Mo];
        }
      } else {
        return "NOT_DATERL";
      }
    }
}   
