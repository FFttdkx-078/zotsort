import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Demo Data ─────────────────────────────────────────────────────
const DEMO_COLLECTIONS = [
  { key: 'col1', name: 'Deep Learning', count: 6 },
  { key: 'col2', name: 'NLP', count: 4 },
  { key: 'col3', name: 'Computer Vision', count: 3 },
]
const DEMO_PAPERS = [
  {
    key: 'p1', collectionKey: 'col1', priority: 3, importance: 5,
    标题: 'Attention Is All You Need',
    作者: 'Vaswani, Ashish; Shazeer, Noam; Parmar, Niki',
    发表年份: '2017', 期刊名称: 'NeurIPS', DOI: '10.48550/arXiv.1706.03762',
    摘要原文: '提出了 Transformer 架构，完全基于注意力机制，摒弃循环和卷积。在机器翻译任务上取得当时最优性能，训练成本显著降低。',
    研究方法: '多头自注意力机制（Multi-Head Self-Attention），通过并行计算序列中所有位置的相互关系，替代传统 RNN 的顺序建模。引入位置编码保留序列信息。',
    主要结论: 'WMT 2014 英德翻译达到 28.4 BLEU，超越现有最优 2 BLEU 以上。8 块 GPU 训练 12 小时即达最优性能。',
    创新点: '1. 完全基于注意力的序列建模；2. 多头注意力并行计算；3. 缩放点积防止梯度消失',
    关键词: '注意力机制, Transformer, 序列建模, 机器翻译', 备注: '', user_notes: '', user_edits: {},
  },
  {
    key: 'p2', collectionKey: 'col1', priority: 2, importance: 4,
    标题: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    作者: 'Devlin, Jacob; Chang, Ming-Wei; Lee, Kenton',
    发表年份: '2018', 期刊名称: 'NAACL-HLT 2019', DOI: '10.18653/v1/N19-1423',
    摘要原文: '提出双向 Transformer 预训练模型 BERT，在 11 项 NLP 任务上刷新最优成绩。',
    研究方法: 'Masked Language Model（MLM）和 Next Sentence Prediction（NSP）两个预训练任务，双向 Transformer 编码器，大规模语料无监督预训练后微调。',
    主要结论: 'GLUE 基准提升 7.7 分，SQuAD v1.1 F1 达到 93.2%，全面超越此前最优模型。',
    创新点: '1. 首个深度双向语言表示模型；2. 统一预训练-微调范式；3. MLM 目标利用完整双向上下文',
    关键词: 'BERT, 预训练, 双向 Transformer, 迁移学习, NLP', 备注: '', user_notes: '', user_edits: {},
  },
  {
    key: 'p3', collectionKey: 'col1', priority: 1, importance: 3,
    标题: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    作者: 'Dosovitskiy, Alexey; Beyer, Lucas; Kolesnikov, Alexander',
    发表年份: '2020', 期刊名称: 'ICLR 2021', DOI: '10.48550/arXiv.2010.11929',
    摘要原文: '将标准 Transformer 直接应用于图像块序列，大规模预训练后图像分类效果出色。',
    研究方法: '图像分割为 16×16 patch 展平输入 Transformer，添加 [CLS] token 分类，可学习 1D 位置嵌入，JFT-300M 预训练后微调。',
    主要结论: 'ImageNet 达到 88.55% top-1 准确率，计算量仅为 BiT 的 1/8。',
    创新点: '1. 首次纯 Transformer 用于图像识别达 SOTA；2. 大规模预训练替代 CNN 归纳偏置；3. 极简架构无卷积',
    关键词: 'Vision Transformer, ViT, 图像分类, 自注意力', 备注: '仅摘要', user_notes: '', user_edits: {},
  },
  {
    key: 'p4', collectionKey: 'col1', priority: 0, importance: 2,
    标题: 'Denoising Diffusion Probabilistic Models',
    作者: 'Ho, Jonathan; Jain, Ajay; Abbeel, Pieter',
    发表年份: '2020', 期刊名称: 'NeurIPS 2020', DOI: '10.48550/arXiv.2006.11239',
    摘要原文: '提出扩散概率生成模型 DDPM，通过学习逆向去噪过程在图像合成上取得高质量结果。',
    研究方法: '前向加噪（Markov 链逐步添加高斯噪声）+ 可学习逆向去噪。U-Net 预测各步骤噪声，均方误差简化损失。',
    主要结论: 'CIFAR-10 达到 3.17 FID（无条件生成），LSUN 256×256 视觉质量与 StyleGAN2 相当。',
    创新点: '1. 建立扩散模型与去噪分数匹配理论联系；2. 预测噪声而非均值；3. 为 Stable Diffusion 奠定基础',
    关键词: '扩散模型, DDPM, 生成模型, 图像合成', 备注: '', user_notes: '', user_edits: {},
  },
  {
    key: 'p5', collectionKey: 'col1', priority: 2, importance: 4,
    标题: 'Learning Transferable Visual Models From Natural Language Supervision',
    作者: 'Radford, Alec; Kim, Jong Wook; Hallacy, Chris',
    发表年份: '2021', 期刊名称: 'ICML 2021', DOI: '10.48550/arXiv.2103.00020',
    摘要原文: 'CLIP 通过 4 亿图文对对比学习预训练，实现强大零样本视觉分类。',
    研究方法: '对比学习联合训练图像编码器（ViT/ResNet）和文本编码器（Transformer），InfoNCE 损失最大化匹配图文对相似度。',
    主要结论: 'ImageNet 零样本 top-1 准确率 76.2%，27 个数据集迁移学习大幅领先。',
    创新点: '1. 大规模图文对比预训练；2. 自然语言作为开放词汇标签空间；3. 真正零样本分类',
    关键词: 'CLIP, 对比学习, 多模态, 零样本迁移', 备注: '', user_notes: '', user_edits: {},
  },
  {
    key: 'p6', collectionKey: 'col1', priority: 3, importance: 5,
    标题: 'Training Language Models to Follow Instructions with Human Feedback',
    作者: 'Ouyang, Long; Wu, Jeffrey; Jiang, Xu',
    发表年份: '2022', 期刊名称: 'NeurIPS 2022', DOI: '10.48550/arXiv.2203.02155',
    摘要原文: '提出 InstructGPT，通过 RLHF 使语言模型遵循人类意图，1.3B 参数模型输出显著优于 175B GPT-3。',
    研究方法: '三阶段：① SFT 有监督微调；② 训练奖励模型（RM）；③ PPO 强化学习以 RM 为反馈进行优化。',
    主要结论: '人类评估者显著偏好 InstructGPT（1.3B）胜过 GPT-3（175B），大幅减少有害内容。',
    创新点: '1. RLHF 在大规模 LLM 对齐的首次系统成功；2. 对齐小模型可超越非对齐大模型；3. ChatGPT 核心技术基础',
    关键词: 'RLHF, 指令微调, 语言模型对齐, 人类反馈强化学习', 备注: '', user_notes: '', user_edits: {},
  },
]

// ── Constants ─────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  0: { label: '—',  color: 'text-[#606060]',  bg: '' },
  1: { label: '低', color: 'text-[#298dff]',  bg: 'rgba(41,141,255,0.12)' },
  2: { label: '中', color: 'text-[#f5c842]',  bg: 'rgba(245,200,66,0.12)' },
  3: { label: '高', color: 'text-[#ff6b6b]',  bg: 'rgba(255,107,107,0.12)' },
}

// ── Icons ─────────────────────────────────────────────────────────
function GridIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
  </svg>
}
function TableIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="6" width="12" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1" y="10" width="12" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
}
function CompareIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="5.5" y="1" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="10" y="1" width="3" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
}
function FolderIcon({ active }) {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 3h4l1 1.5h6v7H1V3z"
      stroke={active ? '#298dff' : 'currentColor'} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
  </svg>
}
function CloseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
}
function SpinnerIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="animate-spin">
    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.2" />
    <path d="M6.5 1.5a5 5 0 015 5" stroke="#298dff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
}
function ExternalLinkIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M7 1h3v3M10 1L5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}
function PencilIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M7.5 1.5l2 2L3 10H1V8L7.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
}

// ── Priority Badge ────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  if (!priority) return null
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] ${cfg.color}`}
      style={{ background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

// ── Star Rating (display) ─────────────────────────────────────────
function Stars({ value, max = 5, size = 'sm', onChange }) {
  const sz = size === 'sm' ? '11px' : '14px'
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n}
          onClick={onChange ? () => onChange(n === value ? 0 : n) : undefined}
          className={`transition-colors ${onChange ? 'hover:scale-110' : 'cursor-default'} ${n <= value ? 'text-[#f5c842]' : 'text-[#606060]'}`}
          style={{ fontSize: sz, lineHeight: 1 }}
          aria-label={onChange ? `${n} 星` : undefined}>
          ★
        </button>
      ))}
    </div>
  )
}

// ── SSE helper ────────────────────────────────────────────────────
async function streamAnalyze({ collectionKeys, itemKeys = null, onTotal, onProgress, onResult, onDone }) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection_keys: collectionKeys, item_keys: itemKeys }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const msg = JSON.parse(line.slice(6))
        if (msg.type === 'total')    onTotal?.(msg.total)
        if (msg.type === 'progress') onProgress?.(msg)
        if (msg.type === 'result')   onResult?.(msg.data)
        if (msg.type === 'done')     onDone?.()
      } catch { /* skip malformed */ }
    }
  }
}

// ── Editable Field ────────────────────────────────────────────────
function EditableSection({ title, content, accent, edited, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content || '')
  useEffect(() => { if (!editing) setDraft(content || '') }, [content, editing])

  const handleSave = () => { onSave(draft); setEditing(false) }
  const handleCancel = () => { setDraft(content || ''); setEditing(false) }

  const labelClass = `${accent ? 'text-[#298dff]' : 'text-[#606060]'} flex items-center gap-1.5`
  const labelStyle = { fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className={labelClass} style={labelStyle}>
          {title}
          {edited && !editing && (
            <span className="text-[#606060] normal-case" style={{ fontSize: '9px', letterSpacing: 0 }}>
              · 已编辑
            </span>
          )}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-[#606060] hover:text-white transition-all p-0.5 rounded"
            title="编辑">
            <PencilIcon />
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            rows={Math.max(3, Math.ceil((draft.length || 60) / 38))}
            className="w-full bg-[#181818] border border-[#298dff]/40 rounded-[7px] px-3 py-2.5
                       text-[#a8a8a8] text-sm leading-[1.65] resize-none
                       focus:outline-none focus:border-[#298dff]/70 transition-colors" />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={handleSave}
              className="bg-[#298dff] text-white text-xs px-3 py-1.5 rounded-[7px] hover:brightness-110 transition-all">
              保存
            </button>
            <button onClick={handleCancel}
              className="text-[#606060] hover:text-white text-xs transition-colors">
              取消
            </button>
            {edited && (
              <button onClick={() => { onSave(null); setEditing(false) }}
                className="text-[#606060] hover:text-[#ff6b6b] text-xs transition-colors ml-auto">
                恢复 AI 原文
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[#a8a8a8] text-sm leading-[1.65] whitespace-pre-line">
          {content || <span className="text-[#606060]">—</span>}
        </p>
      )}
    </div>
  )
}

// ── Paper Card ────────────────────────────────────────────────────
function PaperCard({ paper, selected, analyzing, onClick }) {
  const keywords = (paper.关键词 || '').split(/[,，]/).map(k => k.trim()).filter(Boolean).slice(0, 3)
  const hasAI = !!(paper.研究方法 || paper.主要结论)
  return (
    <button onClick={onClick}
      className={`text-left p-5 rounded-[7px] border transition-all duration-150 w-full relative ${
        analyzing ? 'border-[#298dff]/60 bg-[#298dff]/5'
        : selected ? 'border-[#298dff]/50 bg-[#298dff]/5'
        : 'border-white/10 bg-[#181818] hover:border-white/25'
      }`}>
      {/* Top row: year + priority badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#606060] text-xs">
          {paper.发表年份}{paper.期刊名称 ? ` · ${paper.期刊名称}` : ''}
        </span>
        <div className="flex items-center gap-1.5">
          {analyzing && <SpinnerIcon />}
          <PriorityBadge priority={paper.priority} />
        </div>
      </div>
      <h3 className="text-white text-sm font-normal leading-[1.45] mb-3 line-clamp-3">
        {paper.标题 || '无标题'}
      </h3>
      <p className="text-[#6c7584] text-xs leading-[1.5] mb-3 line-clamp-2">
        {paper.摘要原文 || '暂无摘要'}
      </p>
      {/* Keywords or unanalyzed badge */}
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[20px]">
        {keywords.length > 0 ? keywords.map(k => (
          <span key={k} className="text-[#298dff] px-2 py-0.5 rounded-[4px]"
            style={{ fontSize: '10px', background: 'rgba(41,141,255,0.12)' }}>{k}</span>
        )) : !hasAI && (
          <span className="text-[#606060] px-2 py-0.5 rounded-[4px]"
            style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)' }}>未分析</span>
        )}
      </div>
      {/* Bottom row: author + stars */}
      <div className="flex items-center justify-between">
        <span className="text-[#606060] text-xs truncate mr-2">
          {paper.作者?.split(';')[0]?.trim()}{paper.作者?.includes(';') ? ' et al.' : ''}
        </span>
        {paper.importance > 0 && <Stars value={paper.importance} />}
      </div>
    </button>
  )
}

// ── Paper Table ───────────────────────────────────────────────────
function PaperTable({ papers, selectedKey, analyzingKey, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-black z-10">
          <tr className="border-b border-white/10">
            {['标题', '作者', '年份', '期刊', '重要性', '优先级', '状态'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[#606060] font-normal whitespace-nowrap"
                style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {papers.map(paper => {
            const hasAI = !!(paper.研究方法 || paper.主要结论)
            const isAnalyzing = analyzingKey === paper.key
            const pc = PRIORITY_CONFIG[paper.priority || 0]
            return (
              <tr key={paper.key} onClick={() => onSelect(paper)}
                className={`border-b border-white/5 cursor-pointer transition-colors ${
                  selectedKey === paper.key ? 'bg-[#298dff]/5' : 'hover:bg-white/[0.03]'
                }`}>
                <td className="px-4 py-3 text-white max-w-[240px]"><div className="truncate">{paper.标题}</div></td>
                <td className="px-4 py-3 text-[#6c7584] max-w-[130px]">
                  <div className="truncate">{paper.作者?.split(';')[0]?.trim()}{paper.作者?.includes(';') ? ' et al.' : ''}</div>
                </td>
                <td className="px-4 py-3 text-[#6c7584] whitespace-nowrap">{paper.发表年份}</td>
                <td className="px-4 py-3 text-[#6c7584] max-w-[120px]"><div className="truncate">{paper.期刊名称}</div></td>
                <td className="px-4 py-3">{paper.importance > 0 && <Stars value={paper.importance} />}</td>
                <td className="px-4 py-3">
                  {paper.priority > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] ${pc.color}`}
                      style={{ background: pc.bg }}>{pc.label}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-1.5 text-[#298dff]" style={{ fontSize: '11px' }}>
                      <SpinnerIcon /> 分析中
                    </div>
                  ) : hasAI ? (
                    <span className="text-[#298dff] px-2 py-0.5 rounded-[4px]"
                      style={{ fontSize: '10px', background: 'rgba(41,141,255,0.12)' }}>已分析</span>
                  ) : (
                    <span className="text-[#606060]" style={{ fontSize: '11px' }}>未分析</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Compare Table ─────────────────────────────────────────────────
const COMPARE_FIELDS = [
  { key: '研究方法', label: 'Research Method', width: 240 },
  { key: '主要结论', label: 'Main Conclusion', width: 240 },
  { key: '创新点',   label: 'Innovation',      width: 240 },
  { key: '关键词',   label: 'Keywords',         width: 200 },
]
function CompareTable({ papers }) {
  const analyzed = papers.filter(p => p.研究方法 || p.主要结论)
  const unanalyzed = papers.length - analyzed.length
  return (
    <div className="overflow-x-auto h-full">
      {unanalyzed > 0 && (
        <div className="px-6 py-3 border-b border-white/10 text-[#606060]" style={{ fontSize: '11px' }}>
          {unanalyzed} 篇未分析（点击卡片 → Analyze 可单独分析）
        </div>
      )}
      <table className="border-collapse" style={{ minWidth: `${240 + COMPARE_FIELDS.reduce((a, f) => a + f.width, 0)}px` }}>
        <thead className="sticky top-0 z-10 bg-[#0a0a0a]">
          <tr className="border-b border-white/10">
            <th className="sticky left-0 z-20 bg-[#0a0a0a] text-left px-5 py-3 border-r border-white/10"
              style={{ width: 240, minWidth: 240, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#606060', fontWeight: 400 }}>
              论文
            </th>
            {COMPARE_FIELDS.map(f => (
              <th key={f.key} className="text-left px-5 py-3 border-r border-white/5"
                style={{ width: f.width, minWidth: f.width, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#298dff', fontWeight: 400 }}>
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {analyzed.length === 0 ? (
            <tr><td colSpan={COMPARE_FIELDS.length + 1} className="px-5 py-12 text-center text-[#606060] text-sm">
              还没有已分析的文献
            </td></tr>
          ) : analyzed.map((paper, i) => (
            <tr key={paper.key} className={`border-b border-white/5 align-top ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}>
              <td className="sticky left-0 z-10 px-5 py-4 border-r border-white/10 align-top"
                style={{ width: 240, background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : '#000' }}>
                <div className="flex items-start gap-2 mb-1">
                  <PriorityBadge priority={paper.priority} />
                </div>
                <div className="text-white text-xs font-normal leading-[1.5] mb-1 line-clamp-3">{paper.标题}</div>
                <div className="text-[#606060]" style={{ fontSize: '10px' }}>
                  {paper.发表年份}{paper.作者 ? ' · ' : ''}{paper.作者?.split(';')[0]?.trim()}{paper.作者?.includes(';') ? ' et al.' : ''}
                </div>
                {paper.importance > 0 && <div className="mt-1"><Stars value={paper.importance} /></div>}
              </td>
              {COMPARE_FIELDS.map(f => (
                <td key={f.key} className="px-5 py-4 border-r border-white/5 align-top" style={{ width: f.width }}>
                  {paper[f.key]
                    ? <p className="text-[#a8a8a8] leading-[1.65] whitespace-pre-line" style={{ fontSize: '12px' }}>{paper[f.key]}</p>
                    : <span className="text-[#606060]" style={{ fontSize: '11px' }}>—</span>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────
function MetaRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-[#606060] text-xs w-10 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[#a8a8a8] text-xs leading-relaxed break-all">{value}</span>
    </div>
  )
}

function PrioritySelector({ value, onChange }) {
  return (
    <div>
      <div className="text-[#606060] mb-2" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>优先级</div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map(p => {
          const cfg = PRIORITY_CONFIG[p]
          const active = value === p
          return (
            <button key={p} onClick={() => onChange(active && p !== 0 ? 0 : p)}
              className={`px-2.5 py-1 rounded-[5px] text-xs transition-all border ${
                active ? `${cfg.color} border-current` : 'text-[#606060] border-white/10 hover:border-white/25'
              }`}
              style={active ? { background: cfg.bg } : {}}>
              {cfg.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DetailPanel({ paper, onClose, onAnalyze, analyzing, onUpdate, demoMode }) {
  const hasAI = !!(paper.研究方法 || paper.主要结论)
  const userEdits = paper.user_edits || {}
  const keywords = (paper.关键词 || '').split(/[,，]/).map(k => k.trim()).filter(Boolean)

  const saveField = (field, value) => {
    if (demoMode) return
    if (value === null) {
      onUpdate({ reset_field: field })
    } else {
      onUpdate({ [field]: value })
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-2 mb-5">
          <h2 className="text-white text-sm font-normal leading-[1.5] flex-1">{paper.标题}</h2>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <a href={`zotero://select/library/items/${paper.key}`} title="在 Zotero 中打开"
              className="p-1.5 text-[#606060] hover:text-white transition-colors rounded-[5px] hover:bg-white/5">
              <ExternalLinkIcon />
            </a>
            <button onClick={onClose}
              className="p-1.5 text-[#606060] hover:text-white transition-colors rounded-[5px] hover:bg-white/5">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="mb-5">
          <MetaRow label="作者" value={paper.作者} />
          <MetaRow label="年份" value={paper.发表年份} />
          <MetaRow label="期刊" value={paper.期刊名称} />
          <MetaRow label="DOI" value={paper.DOI} />
        </div>

        {/* Priority & Importance */}
        <div className="flex gap-6 mb-6 pb-5 border-b border-white/10">
          <PrioritySelector value={paper.priority || 0}
            onChange={v => onUpdate({ priority: v })} />
          <div>
            <div className="text-[#606060] mb-2" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>重要性</div>
            <Stars value={paper.importance || 0} size="md"
              onChange={v => onUpdate({ importance: v })} />
          </div>
        </div>

        {/* User Notes */}
        <div className="mb-6 pb-5 border-b border-white/10">
          <div className="text-[#606060] mb-2" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>我的笔记</div>
          <textarea
            defaultValue={paper.user_notes || ''}
            placeholder="记录你对这篇文献的想法..."
            onBlur={e => { if (e.target.value !== (paper.user_notes || '')) onUpdate({ user_notes: e.target.value }) }}
            rows={3}
            className="w-full bg-[#181818] border border-white/10 rounded-[7px] px-3 py-2.5
                       text-[#a8a8a8] text-xs leading-[1.65] resize-none placeholder-[#606060]
                       focus:outline-none focus:border-[#298dff]/50 transition-colors"
          />
        </div>

        {/* AI Fields */}
        <div className="space-y-6">
          <EditableSection title="摘要" content={paper.摘要原文}
            edited={!!userEdits['摘要原文']}
            onSave={v => saveField('摘要原文', v)} />

          {hasAI ? (
            <>
              {['研究方法', '主要结论', '创新点'].map(field => (
                <EditableSection key={field} title={field} content={paper[field]} accent
                  edited={!!userEdits[field]}
                  onSave={v => saveField(field, v)} />
              ))}
              <EditableSection title="关键词" content={paper.关键词} accent
                edited={!!userEdits['关键词']}
                onSave={v => saveField('关键词', v)} />
              {keywords.length > 0 && (
                <div className="-mt-4 flex flex-wrap gap-1.5">
                  {keywords.map(k => (
                    <span key={k} className="text-[#298dff] px-2 py-1 rounded-[4px]"
                      style={{ fontSize: '12px', background: 'rgba(41,141,255,0.12)' }}>{k}</span>
                  ))}
                </div>
              )}
              <button onClick={onAnalyze} disabled={analyzing}
                className="flex items-center gap-2 text-[#606060] hover:text-white transition-colors"
                style={{ fontSize: '11px' }}>
                {analyzing ? <><SpinnerIcon /> 分析中...</> : '重新分析'}
              </button>
            </>
          ) : (
            <div className="border border-white/10 rounded-[7px] p-5">
              <p className="text-[#6c7584] text-xs mb-4 leading-relaxed">此文献尚未经过 AI 分析</p>
              <button onClick={onAnalyze} disabled={analyzing}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-[7px] w-full justify-center transition-all
                  ${analyzing ? 'bg-white/5 text-[#606060] cursor-not-allowed' : 'bg-[#298dff] text-white hover:brightness-110'}`}>
                {analyzing ? <><SpinnerIcon /> 分析中...</> : 'Analyze'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sorting helper ────────────────────────────────────────────────
function sortPapers(papers, sortBy) {
  const arr = [...papers]
  switch (sortBy) {
    case 'importance_desc': return arr.sort((a, b) => (b.importance || 0) - (a.importance || 0))
    case 'priority_desc':   return arr.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    case 'year_desc':       return arr.sort((a, b) => (b.发表年份 || '').localeCompare(a.发表年份 || ''))
    case 'year_asc':        return arr.sort((a, b) => (a.发表年份 || '').localeCompare(b.发表年份 || ''))
    default:                return arr
  }
}

// ── Dashboard ─────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [demoMode, setDemoMode]   = useState(false)

  const [collections, setCollections]               = useState([])
  const [selectedCollectionKey, setSelectedCollectionKey] = useState(null)
  const [papers, setPapers]       = useState([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [papersLoading, setPapersLoading]           = useState(false)

  const [selectedPaper, setSelectedPaper] = useState(null)
  const [viewMode, setViewMode]   = useState('grid')
  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState('default')
  const [filterPriority, setFilterPriority] = useState(null) // null=all, 1/2/3=filtered

  const [batchAnalyzing, setBatchAnalyzing]   = useState(false)
  const [batchProgress, setBatchProgress]     = useState({ current: 0, total: 0, label: '' })
  const [batchAnalyzingKey, setBatchAnalyzingKey] = useState(null)
  const [singleAnalyzingKey, setSingleAnalyzingKey] = useState(null)

  // ── Merge helper ──
  const mergePaper = useCallback((data) => {
    setPapers(prev => prev.map(p => p.key === data.key ? { ...p, ...data } : p))
    setSelectedPaper(prev => prev?.key === data.key ? { ...prev, ...data } : prev)
  }, [])

  // ── Fetch collections ──
  useEffect(() => {
    fetch('/api/collections')
      .then(async r => {
        if (r.status === 503) throw new Error('zotero_offline')
        if (!r.ok) throw new Error('api_error')
        return r.json()
      })
      .then(data => {
        setCollections(data)
        if (data.length > 0) setSelectedCollectionKey(data[0].key)
      })
      .catch(err => {
        setDemoMode(err.message === 'zotero_offline' ? 'zotero' : 'backend')
        setCollections(DEMO_COLLECTIONS)
        setSelectedCollectionKey(DEMO_COLLECTIONS[0].key)
      })
      .finally(() => setCollectionsLoading(false))
  }, [])

  // ── Fetch papers ──
  useEffect(() => {
    if (!selectedCollectionKey) return
    setSelectedPaper(null)
    if (demoMode) {
      setPapers(DEMO_PAPERS.filter(p => p.collectionKey === selectedCollectionKey))
      return
    }
    setPapersLoading(true)
    setPapers([])
    fetch(`/api/collections/${selectedCollectionKey}/papers`)
      .then(r => r.json())
      .then(data => setPapers(data))
      .catch(e => console.error(e))
      .finally(() => setPapersLoading(false))
  }, [selectedCollectionKey, demoMode])

  // ── Update paper via API ──
  const handleUpdate = useCallback(async (paperKey, updates) => {
    if (demoMode) return
    try {
      const res = await fetch(`/api/papers/${paperKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const updated = await res.json()
        if (updated.key) mergePaper(updated)
      }
    } catch (e) {
      console.error('Update error:', e)
    }
  }, [demoMode, mergePaper])

  // ── Batch analyze ──
  const handleBatchAnalyze = async () => {
    if (batchAnalyzing || !selectedCollectionKey || demoMode) return
    setBatchAnalyzing(true)
    setBatchProgress({ current: 0, total: 0, label: '' })
    try {
      await streamAnalyze({
        collectionKeys: [selectedCollectionKey],
        onTotal: total => setBatchProgress(p => ({ ...p, total })),
        onProgress: msg => {
          setBatchProgress({ current: msg.index, total: msg.total, label: msg.title })
          const match = papers.find(p => p.标题 === msg.title)
          setBatchAnalyzingKey(match?.key ?? null)
        },
        onResult: data => { setBatchAnalyzingKey(null); mergePaper(data) },
        onDone: () => { setBatchAnalyzing(false); setBatchAnalyzingKey(null); setBatchProgress({ current: 0, total: 0, label: '' }) },
      })
    } catch (e) { console.error(e) }
    finally { setBatchAnalyzing(false); setBatchAnalyzingKey(null) }
  }

  // ── Single analyze ──
  const handleSingleAnalyze = async (paper) => {
    if (singleAnalyzingKey || demoMode) return
    setSingleAnalyzingKey(paper.key)
    try {
      await streamAnalyze({
        collectionKeys: [selectedCollectionKey],
        itemKeys: [paper.key],
        onResult: data => mergePaper(data),
        onDone: () => setSingleAnalyzingKey(null),
      })
    } catch (e) { console.error(e) }
    finally { setSingleAnalyzingKey(null) }
  }

  // ── Filtered + sorted papers ──
  const visiblePapers = sortPapers(
    papers.filter(p => {
      const matchSearch = !search ||
        (p.标题 || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.作者 || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.关键词 || '').includes(search)
      const matchPriority = filterPriority === null || p.priority === filterPriority
      return matchSearch && matchPriority
    }),
    sortBy
  )

  const analyzingKey = batchAnalyzingKey || singleAnalyzingKey

  const handleViewMode = (mode) => {
    setViewMode(mode)
    if (mode === 'compare') setSelectedPaper(null)
  }

  return (
    <div className="bg-black h-screen flex flex-col text-[#6c7584] overflow-hidden">

      {/* Demo Banner */}
      {demoMode && (
        <div className="flex-shrink-0 bg-[#298dff]/10 border-b border-[#298dff]/20 px-4 py-2 flex items-center justify-between">
          <p className="text-[#298dff] text-xs">
            {demoMode === 'zotero'
              ? 'Zotero 未运行 — 请打开 Zotero 桌面端，然后刷新页面。'
              : '后端未连接 — 请执行 cd ~/zotsort/backend && python3 main.py，然后刷新。'}
            &nbsp;现在展示模拟数据。
          </p>
          <button onClick={() => window.location.reload()} className="text-[#298dff] text-xs hover:underline ml-4 flex-shrink-0">
            刷新重试
          </button>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-[56px] border-b border-white/10 flex items-center px-4 gap-3 flex-shrink-0 bg-black">
        <button onClick={() => navigate('/')}
          className="text-white font-medium text-[15px] hover:opacity-70 transition-opacity tracking-tight mr-1">
          ZotSort
        </button>
        <div className="w-px h-4 bg-white/15" />

        {/* Search */}
        <div className="flex-1 max-w-[320px]">
          <input type="text" placeholder="搜索标题、作者、关键词..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-white/10 rounded-[7px] px-3 py-1.5 text-sm
                       text-[#a8a8a8] placeholder-[#606060] focus:outline-none focus:border-[#298dff]/50 transition-colors" />
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-[#181818] border border-white/10 rounded-[7px] px-2.5 py-1.5 text-xs text-[#a8a8a8]
                     focus:outline-none focus:border-[#298dff]/50 transition-colors appearance-none cursor-pointer">
          <option value="default">默认排序</option>
          <option value="importance_desc">重要性 ↓</option>
          <option value="priority_desc">优先级 ↓</option>
          <option value="year_desc">年份 ↓</option>
          <option value="year_asc">年份 ↑</option>
        </select>

        {/* Priority filter chips */}
        <div className="hidden md:flex items-center gap-1">
          {[{ v: null, label: '全部' }, { v: 3, label: '高' }, { v: 2, label: '中' }, { v: 1, label: '低' }].map(({ v, label }) => (
            <button key={String(v)} onClick={() => setFilterPriority(v === filterPriority ? null : v)}
              className={`px-2 py-1 rounded-[5px] text-xs transition-colors ${
                filterPriority === v
                  ? 'bg-[#298dff]/20 text-[#298dff]'
                  : 'text-[#606060] hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-[7px] p-1">
            {[{ mode: 'grid', Icon: GridIcon, label: 'Grid' }, { mode: 'table', Icon: TableIcon, label: 'Table' }, { mode: 'compare', Icon: CompareIcon, label: 'Compare' }].map(({ mode, Icon, label }) => (
              <button key={mode} onClick={() => handleViewMode(mode)}
                className={`p-1.5 rounded-[5px] transition-colors ${viewMode === mode ? 'bg-[#298dff]/20 text-[#298dff]' : 'text-[#606060] hover:text-white'}`}
                aria-label={label}>
                <Icon />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[216px] flex-shrink-0 border-r border-white/10 bg-[#0a0a0a] flex flex-col">
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-[#606060] px-2 mb-3 mt-2"
              style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Collections</div>
            {collectionsLoading ? (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-[#606060]"><SpinnerIcon /> 加载中...</div>
            ) : collections.map(({ key, name, count }) => (
              <button key={key} onClick={() => setSelectedCollectionKey(key)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-[7px] text-sm transition-colors text-left mb-0.5 ${
                  selectedCollectionKey === key
                    ? 'bg-[#298dff]/10 text-white border border-[#298dff]/25'
                    : 'text-[#6c7584] hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <FolderIcon active={selectedCollectionKey === key} />
                <span className="flex-1 truncate">{name}</span>
                <span className="text-[#606060]" style={{ fontSize: '11px' }}>{count}</span>
              </button>
            ))}
          </div>
          {/* Analyze All */}
          <div className="border-t border-white/10 p-3">
            {batchAnalyzing ? (
              <div>
                <div className="flex justify-between text-xs text-[#a8a8a8] mb-2">
                  <span className="flex items-center gap-1.5"><SpinnerIcon /> 批量分析</span>
                  <span className="tabular-nums">{batchProgress.current}/{batchProgress.total}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[#298dff] rounded-full transition-all duration-500"
                    style={{ width: batchProgress.total ? `${(batchProgress.current / batchProgress.total) * 100}%` : '0%' }} />
                </div>
                {batchProgress.label && (
                  <div className="text-[#606060] truncate" style={{ fontSize: '10px' }}>{batchProgress.label}</div>
                )}
              </div>
            ) : (
              <button onClick={handleBatchAnalyze} disabled={!!demoMode}
                className={`w-full text-sm py-2 rounded-[7px] transition-all
                  ${demoMode ? 'bg-white/10 text-[#606060] cursor-not-allowed' : 'bg-[#298dff] text-white hover:brightness-110'}`}>
                Analyze All
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-black min-w-0">
          {papersLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-[#606060] text-sm">
              <SpinnerIcon /> 加载文献...
            </div>
          ) : viewMode === 'compare' ? (
            <CompareTable papers={visiblePapers} />
          ) : visiblePapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-[#606060] text-sm">{search || filterPriority !== null ? '未找到匹配文献' : '此集合没有文献'}</p>
              {(search || filterPriority !== null) && (
                <button onClick={() => { setSearch(''); setFilterPriority(null) }}
                  className="text-[#298dff] text-xs hover:underline">清除筛选</button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visiblePapers.map(paper => (
                <PaperCard key={paper.key} paper={paper}
                  selected={selectedPaper?.key === paper.key}
                  analyzing={analyzingKey === paper.key}
                  onClick={() => setSelectedPaper(prev => prev?.key === paper.key ? null : paper)} />
              ))}
            </div>
          ) : (
            <PaperTable papers={visiblePapers} selectedKey={selectedPaper?.key}
              analyzingKey={analyzingKey}
              onSelect={p => setSelectedPaper(prev => prev?.key === p.key ? null : p)} />
          )}
        </main>

        {/* Detail Panel */}
        {selectedPaper && viewMode !== 'compare' && (
          <aside className="w-[360px] flex-shrink-0 border-l border-white/10 bg-[#0a0a0a] overflow-hidden">
            <DetailPanel
              paper={selectedPaper}
              onClose={() => setSelectedPaper(null)}
              onAnalyze={() => handleSingleAnalyze(selectedPaper)}
              analyzing={singleAnalyzingKey === selectedPaper.key}
              onUpdate={updates => handleUpdate(selectedPaper.key, updates)}
              demoMode={demoMode}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
