"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const AnalyticsChart = ({ entries }: { entries: any[] }) => {
  // ক্যাটাগরি অনুযায়ী খরচ হিসাব করা (শুধুমাত্র Completed Expense গুলো)
  const categoryData = entries
    .filter(e => e.type === 'expense' && e.status === 'Completed')
    .reduce((acc: any, curr) => {
      const found = acc.find((item: any) => item.name === curr.category);
      if (found) {
        found.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);

  // প্রিমিয়াম কালার প্যালেট
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (categoryData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-40">
        <div className="w-12 h-12 mb-3 border-2 border-dashed border-slate-500 rounded-full flex items-center justify-center text-xs italic">?</div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No expense data to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
          >
            {categoryData.map((entry: any, index: number) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} // এখানে ফিক্স করা হয়েছে
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            cursor={{ fill: 'transparent' }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            wrapperStyle={{ 
              fontSize: '10px', 
              fontWeight: '800', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              paddingTop: '20px'
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};