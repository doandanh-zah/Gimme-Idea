// Reads only the local Supabase runtime; secrets stay in child-process environment.
const {execFileSync,spawn}=require('node:child_process');
const d=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
if(d.API_URL!=='http://127.0.0.1:54321') throw new Error('Expected local Supabase');
const api=process.argv[2]==='api';
const build=process.argv[2]==='build';
const env={...process.env};
if(api)Object.assign(env,{DATABASE_URL:d.DB_URL,STORAGE_ENDPOINT:d.API_URL,STORAGE_SERVICE_ROLE_KEY:d.SERVICE_ROLE_KEY,ENABLE_DEV_MOCK_AUTH:'true',DEV_AUTH_SECRET:'e2e-development-auth-secret-change-me',CORS_ALLOWED_ORIGINS:'http://127.0.0.1:3010,http://127.0.0.1:3011',LOG_LEVEL:'silent'});
else Object.assign(env,{NEXT_PUBLIC_SUPABASE_URL:d.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:d.ANON_KEY,NEXT_PUBLIC_API_URL:'http://127.0.0.1:3001',API_INTERNAL_URL:'http://127.0.0.1:3001'});
const child=spawn('pnpm',build?['build']:['--filter',api?'@gimme-idea/api':'@gimme-idea/web','dev',...api?[]:['--port','3010']],{env,stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??0));
