const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
const fs=require('fs'),path=require('path');
const ADDR_FILE=path.join('/tmp','ltc_address.txt');
function getAddress(){try{return fs.readFileSync(ADDR_FILE,'utf8').trim();}catch{return process.env.LTC_ADDRESS||null;}}
module.exports = {
  data: new SlashCommandBuilder().setName('balance').setDescription('💰 Check LTC wallet'),
  async execute(interaction){
    const address=getAddress();
    if(!address)return interaction.reply({content:'⚠️ No LTC address set. Use `/setaddress` first.',ephemeral:true});
    await interaction.deferReply();
    try{
      const[balRes,priceRes,txRes]=await Promise.all([fetch('https://api.blockcypher.com/v1/ltc/main/addrs/'+address+'/balance'),fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd'),fetch('https://api.blockcypher.com/v1/ltc/main/addrs/'+address+'?limit=10')]);
      const balData=await balRes.json(),priceData=await priceRes.json(),txData=await txRes.json();
      if(balData.error)return interaction.editReply({content:'❌ '+balData.error});
      const ltcPrice=priceData?.litecoin?.usd??0;
      const confirmed=balData.balance/1e8,unconfirmed=balData.unconfirmed_balance/1e8,totalRecv=balData.total_received/1e8,totalSent=balData.total_sent/1e8;
      const toUSD=ltc=>'$'+(ltc*ltcPrice).toFixed(2);
      const txLines=[];
      if(txData.txrefs){for(const tx of txData.txrefs.filter(t=>!t.spent).slice(0,5)){txLines.push((tx.confirmations>0?'✅':'⏳')+' `'+(tx.value/1e8).toFixed(8)+' LTC` ('+toUSD(tx.value/1e8)+') • '+new Date(tx.confirmed||tx.received).toLocaleDateString());}}
      const lines=['`'+address+'`','','**LTC $'+ltcPrice.toFixed(2)+'**','','💰 Confirmed: `'+confirmed.toFixed(8)+' LTC` • `'+toUSD(confirmed)+'`','⏳ Pending: `'+unconfirmed.toFixed(8)+' LTC` • `'+toUSD(unconfirmed)+'`','📥 Received: `'+totalRecv.toFixed(8)+' LTC` • `'+toUSD(totalRecv)+'`','📤 Sent: `'+totalSent.toFixed(8)+' LTC` • `'+toUSD(totalSent)+'`','🔁 Txs: `'+balData.n_tx+'`'];
      if(txLines.length)lines.push('','**Recent**',...txLines);
      lines.push('','[View on Blockchain](https://live.blockcypher.com/ltc/address/'+address+'/)');
      await interaction.editReply({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription(lines.join('\n')).setThumbnail(IMAGES.balance).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    }catch(e){await interaction.editReply({content:'❌ Failed to fetch.'});}
  },
};
