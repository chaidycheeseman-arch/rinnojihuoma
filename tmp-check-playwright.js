try { console.log(require.resolve('playwright')); } catch (e) { console.error(e && e.message ? e.message : e); process.exit(1); }
