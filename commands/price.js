const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PURPLE, IMAGES } = require('../utils/theme');
const COIN_IDS={btc:'bitcoin',eth:'ethereum',sol:'solana',ltc:'litecoin',xrp:'ripple',bnb:'binancecoin',usdt:'tether',usdc:'usd-coin',ada:'cardano',doge:'dogecoin',dot:'polkadot',matic:'matic-network',avax:'avalanche-2',link:'chainlink',uni:'uniswap',shib:'shiba-inu',trx:'tron',xlm:'stellar',atom:'cosmos',near:'near'};
module.exports = {
  data: new SlashCommandBuilder().setName('price').setDescription('💰  Check live crypto price')
    .addStringOption(o=>o.setName('coin').setDescription('Coin ticker e.g. BTC ETH SOL').setRequired(true)),
  async execute(interaction){
    const ticker=interaction.options.getString('coin').toLowerCase().replace('$','');
    const coinId=COIN_IDS[ticker];
    if(!coinId)return interaction.reply({content:'❌  Unknown coin `'+ticker.toUpperCase()+'`. Try: '+Object.keys(COIN_IDS).map(k=>k.toUpperCase()).join(', '),ephemeral:true});
    await interaction.deferReply();
    try{
      const res=await fetch('https://api.coingecko.com/api/v3/coins/'+coinId+'?localization=false&tickers=false&community_data=false&developer_data=false');
      const data=await res.json();
      const price=data.market_data.current_price.usd;
      const change24=data.market_data.price_change_percentage_24h;
      const change7=data.market_data.price_change_percentage_7d;
      const high24=data.market_data.high_24h.usd;
      const low24=data.market_data.low_24h.usd;
      const marketCap=data.market_data.market_cap.usd;
      const vol24=data.market_data.total_volume.usd;
      const rank=data.market_cap_rank;
      const fmt=n=>n>=1e9?'$'+(n/1e9).toFixed(2)+'B':n>=1e6?'$'+(n/1e6).toFixed(2)+'M':'$'+n.toLocaleString();
      const pct=n=>(n>=0?'▲ +':'▼ ')+n.toFixed(2)+'%';
      const color=change24>=0?0x00E676:0xFF1744;
      const embed=new EmbedBuilder().setColor(color)
        .setTitle(data.name+'  ('+ticker.toUpperCase()+')')
        .setDescription('# $'+price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:8}))
        .setThumbnail(data.image?.small||IMAGES.logo)
        .setImage(IMAGES.price)
        .addFields(
          {name:'24h Change',value:'`'+pct(change24)+'`',inline:true},
          {name:'7d Change',value:'`'+pct(change7)+'`',inline:true},
          {name:'Rank',value:'`#'+rank+'`',inline:true},
          {name:'24h High',value:'`'+fmt(high24)+'`',inline:true},
          {name:'24h Low',value:'`'+fmt(low24)+'`',inline:true},
          {name:'Volume 24h',value:'`'+fmt(vol24)+'`',inline:true},
          {name:'Market Cap',value:'`'+fmt(marketCap)+'`',inline:false},
        )
        .setTimestamp()
        .setFooter({text:'KONVAULT™  •  Live Price',iconURL:IMAGES.logo});
      await interaction.editReply({embeds:[embed]});
    }catch(err){console.error(err);await interaction.editReply({content:'❌  Failed to fetch price.'});}
  },
};
