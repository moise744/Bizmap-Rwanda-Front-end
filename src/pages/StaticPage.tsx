import React from 'react';

const StaticPage: React.FC<{ title: string; children: React.ReactNode }>=({ title, children })=>{
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="prose dark:prose-invert">{children}</div>
      </div>
    </div>
  );
};

export default StaticPage;


