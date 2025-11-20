import plugin from "../plugin.json";

class AcodePlugin {
 constructor() {
  
 }
 
 async init(){
   console.log("%c[Agente IA] Iniciado.", "color:blue;font-weight:bold");
  
 }
 async destroy(){
  console.log("%c[Agente IA] Destruido.", "color:red;font-weight:bold");
 }
 
}


// === INICIALIZAÇÃO DO PLUGIN ===
if (window.acode) {
 const acodePlugin = new AcodePlugin();

 acode.setPluginInit(plugin.id, async (baseUrl: string, $page: any, { cacheFileUrl, cacheFile }: any) => {
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  acodePlugin.baseUrl = baseUrl;
  await acodePlugin.init();
 });

 acode.setPluginUnmount(plugin.id, () => {
  acodePlugin.destroy();
 });
}
