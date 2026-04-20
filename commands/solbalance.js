const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const fs = require('fs'), path = require('path');
const ADDR_FILE = path.join('/tmp','sol_address.txt');
function getAddress(){try{return fs.readFileSync(ADDR_FILE,'utf8').trim();}catch{return process.env.SOL_ADDRESS||null;}}
module.exports = {
  data: new SlashCommandBuilder().setName('solbalance').setDescription('💜  Check the Konvault SOL wallet'),
  async execute(interaction){
    const address=getAddress();
    if(!address)return interaction.reply({content:'⚠️  No SOL address set. Use `/setsoladdress` first.',ephemeral:true});
    await interaction.deferReply();
    try{
      const [balRes,priceRes,txRes]=await Promise.all([fetch('https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:[address]})}),fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'),fetch('https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getSignaturesForAddress',params:[address,{limit:10}]})})]);
      const balData=await balRes.json(),priceData=await priceRes.json(),txData=await txRes.json();
      if(balData.error)return interaction.editReply({content:'❌  '+balData.error.message});
      const solPrice=priceData?.solana?.usd??0,solBal=(balData.result?.value??0)/1e9;
      const toUSD=sol=>'$'+(sol*solPrice).toFixed(2);
      const txList=txData.result??[];
      const txLines=txList.slice(0,5).map(tx=>(tx.err?'❌':'✅')+'  `'+tx.signature.slice(0,8)+'...'+tx.signature.slice(-8)+'`  •  '+(tx.blockTime?new Date(tx.blockTime*1000).toLocaleDateString():'Pending'));
      const lines=['`'+address+'`','','**SOL Price:** `$'+solPrice.toFixed(2)+'`','','💜  **Balance:** `'+solBal.toFixed(9)+' SOL`  •  `'+toUSD(solBal)+'`','🔁  **Transactions:** `'+txList.length+'`'];
      if(txLines.length)lines.push('','**Last 5 Transactions**',...txLines);
      lines.push('','[View on Solscan](https://solscan.io/account/'+address+')');
      await interaction.editReply({embeds:[em('Konvault\' SOL Wallet',lines.join('\n'),null,'solbalance')]});
    }catch(err){console.error(err);await interaction.editReply({content:'❌  Failed to fetch.'});}
  },
};
