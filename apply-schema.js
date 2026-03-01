import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 从 supabaseClient.ts 复制配置
const supabaseUrl = 'https://hlfkcmgumiwmemcnnukl.supabase.co';
const supabaseAnonKey = 'sb_publishable_xXGe5a0lz7nyJRw0KV9QxQ_qtWSh8Cu';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applySchema() {
  try {
    console.log('Applying schema changes...');
    
    // 读取 SQL 文件
    const sqlContent = fs.readFileSync('./supabase/apply_schema.sql', 'utf8');
    
    // 分割 SQL 语句（按分号分割）
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    // 执行每个 SQL 语句
    for (const statement of statements) {
      console.log('Executing statement:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('Error executing statement:', error);
        return;
      }
    }
    
    console.log('Schema changes applied successfully!');
  } catch (error) {
    console.error('Error applying schema:', error);
  }
}

applySchema();