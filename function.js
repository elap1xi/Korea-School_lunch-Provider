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
    
  
