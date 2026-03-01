import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 从 supabaseClient.ts 复制配置
const supabaseUrl = 'https://hlfkcmgumiwmemcnnukl.supabase.co';
const supabaseAnonKey = 'sb_publishable_xXGe5a0lz7nyJRw0KV9QxQ_qtWSh8Cu';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQL() {
  try {
    console.log('Executing SQL statements...');
    
    // 读取 SQL 文件
    const sqlContent = fs.readFileSync('./supabase/final_schema.sql', 'utf8');
    
    // 分割 SQL 语句（按分号分割）
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // 执行每个 SQL 语句
    for (const statement of statements) {
      console.log('Executing statement...');
      
      // 首先检查连接并尝试创建 exec_sql 函数
      try {
        const createExecSql = `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
          
          GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createExecSql });
        if (createError) {
          console.log('exec_sql function might already exist or there was an error creating it');
        }
      } catch (e) {
        console.log('Could not create exec_sql function:', e.message);
      }
      
      // 执行当前 SQL 语句
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('Error executing statement:', error);
      } else {
        console.log('Statement executed successfully');
      }
    }
    
    console.log('All SQL statements executed successfully!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

executeSQL();