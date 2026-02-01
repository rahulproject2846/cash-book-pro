"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

export const AnalyticsChart = ({ entries }: { entries: any[] }) => {
    
    // ১. ডাটা প্রসেসিং: ক্যাটাগরি অনুযায়ী খরচ ক্যালকুলেট করা
    const categoryData = entries
        .filter(e => 
            // 🔥 ফিক্স: ছোট/বড় হাতের সমস্যা এড়াতে toLowerCase() ব্যবহার করা হলো
            (e.type || '').toLowerCase() === 'expense' && 
            (e.status || '').toLowerCase() === 'completed'
        )
        .reduce((acc: any, curr) => {
            // ক্যাটাগরি নাম ক্লিন করা (সবসময় আপারকেস দেখানোর জন্য)
            const catName = (curr.category || 'GENERAL').toUpperCase();
            const amount = Number(curr.amount) || 0;

            const found = acc.find((item: any) => item.name === catName);
            
            if (found) {
                found.value += amount;
            } else {
                acc.push({ name: catName, value: amount });
            }
            return acc;
        }, []);

    // ২. প্রিমিয়াম স্টুডিও কালার প্যালেট
    const COLORS = [
        '#F97316', // Vault Orange
        '#3B82F6', // Tech Blue
        '#10B981', // Success Green
        '#EF4444', // Danger Red
        '#8B5CF6', // Royal Purple
        '#06B6D4', // Ocean Cyan
        '#FACC15'  // Warning Yellow
    ];

    // ৩. ডাটা না থাকলে এম্পটি স্টেট
    if (categoryData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <div className="w-16 h-16 mb-4 border-2 border-dashed border-[var(--text-muted)] rounded-[24px] flex items-center justify-center shadow-inner">
                    <PieIcon size={24} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[4px] text-[var(--text-muted)] text-center">
                    Protocol: No Expense Data Available
                </p>
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full mt-2 anim-fade-up">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={75}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={1200}
                    >
                        {categoryData.map((entry: any, index: number) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                className="hover:opacity-85 transition-opacity cursor-pointer outline-none"
                                style={{ filter: `drop-shadow(0 4px 10px rgba(0,0,0,0.2))` }}
                            />
                        ))}
                    </Pie>
                    
                    {/* কাস্টম প্রিমিয়াম টুলটিপ */}
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1A1A1B', 
                            border: '1px solid #2D2D2D', 
                            borderRadius: '20px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            padding: '12px 16px'
                        }}
                        itemStyle={{ 
                            color: '#F0F0F0', 
                            fontSize: '11px', 
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                        cursor={{ fill: 'transparent' }}
                    />

                    {/* কাস্টম লেজেন্ড */}
                    <Legend 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ 
                            fontSize: '9px', 
                            fontWeight: '900', 
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            paddingTop: '35px',
                            opacity: 0.7
                        }} 
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};