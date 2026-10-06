foundationStart().catch(error=>{login();notice(error.message||'Não foi possível abrir o sistema.');});
