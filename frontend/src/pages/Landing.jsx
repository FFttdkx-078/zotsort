import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// ── Three.js: Fluid Blob ──────────────────────────────────────────
function FluidBlob() {
  const mesh = useRef()

  useFrame((state) => {
    if (!mesh.current) return
    const t = state.clock.getElapsedTime()
    mesh.current.rotation.y = t * 0.12
    mesh.current.rotation.x = Math.sin(t * 0.2) * 0.12
    mesh.current.position.x = THREE.MathUtils.lerp(
      mesh.current.position.x,
      state.mouse.x * 0.8 + 2.2,
      0.018
    )
    mesh.current.position.y = THREE.MathUtils.lerp(
      mesh.current.position.y,
      state.mouse.y * 0.5,
      0.018
    )
  })

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
      <mesh ref={mesh} position={[2.2, 0, 0]}>
        <sphereGeometry args={[2, 128, 128]} />
        <MeshDistortMaterial
          color="#0a2f8f"
          distort={0.38}
          speed={2.2}
          roughness={0.04}
          metalness={0.9}
          emissive="#298dff"
          emissiveIntensity={0.55}
        />
      </mesh>
    </Float>
  )
}

// ── Three.js: Particle Field ──────────────────────────────────────
function Particles() {
  const points = useRef()
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 300
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!points.current) return
    points.current.rotation.y = state.clock.getElapsedTime() * 0.025
    points.current.rotation.x = state.clock.getElapsedTime() * 0.01
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.035} color="#298dff" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

// ── Header ────────────────────────────────────────────────────────
function Header({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'Demo', href: '#demo' },
    { label: 'GitHub', href: '#' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/95 backdrop-blur-sm border-b border-white/10' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <a href="/" className="text-white font-medium text-[15px] tracking-tight hover:opacity-75 transition-opacity">
            ZotSort
          </a>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[#6c7584] hover:text-white text-sm transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="hidden md:block bg-[#298dff] text-white text-[14px] font-normal px-[10.5px] py-[9px] rounded-[7px]
                         hover:brightness-110 transition-all duration-150
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#298dff]"
            >
              Get Started
            </button>
            <button
              className="md:hidden text-[#6c7584] hover:text-white p-2 transition-colors"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="h-[60px] flex items-center justify-between px-6">
            <span className="text-white font-medium text-[15px]">ZotSort</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-[#6c7584] hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-8 px-6 pt-16">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="text-white text-5xl font-normal tracking-tight hover:text-[#6c7584] transition-colors"
              >
                {label}
              </a>
            ))}
            <button
              onClick={() => { setMenuOpen(false); onGetStarted() }}
              className="self-start bg-[#298dff] text-white text-sm px-5 py-3 rounded-[7px] mt-4"
            >
              Get Started
            </button>
          </nav>
        </div>
      )}
    </>
  )
}

// ── Hero ──────────────────────────────────────────────────────────
function Hero({ onGetStarted }) {
  return (
    <section className="relative h-svh min-h-[600px] flex items-center overflow-hidden bg-black">
      <div className="absolute inset-0" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0, 7.5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.05} />
          <pointLight position={[4, 4, 3]} intensity={3} color="#298dff" />
          <pointLight position={[-5, -3, -4]} intensity={1} color="#1040bb" />
          <Suspense fallback={null}>
            <FluidBlob />
            <Particles />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full pt-[60px]">
        <div className="max-w-[640px]">
          <p
            className="text-[#6c7584] mb-10 font-normal"
            style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            AI-Powered Literature Management
          </p>
          <h1
            className="font-normal text-white leading-[1.04] mb-8"
            style={{
              fontSize: 'clamp(52px, 9.5vw, 140px)',
              letterSpacing: 'clamp(-2px, -0.4vw, -5.5px)',
            }}
          >
            Your research,<br />distilled.
          </h1>
          <p className="text-[#6c7584] text-[18px] leading-[1.35] mb-12 max-w-[400px]">
            用 AI 自动整理 Zotero 文献，<br />
            提取方法、结论与创新点。
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onGetStarted}
              className="bg-[#298dff] text-white text-[14px] font-normal px-5 py-3 rounded-[7px]
                         hover:brightness-110 transition-all duration-150
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#298dff]"
            >
              Get Started
            </button>
            <a
              href="#features"
              className="text-white text-[14px] font-normal px-5 py-3 rounded-[7px]
                         border border-white/25 hover:border-white/50 transition-all duration-150
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#298dff]"
            >
              See how it works
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#6c7584]" aria-hidden="true">
        <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#6c7584] to-transparent" />
      </div>
    </section>
  )
}

// ── Social Proof ──────────────────────────────────────────────────
function SocialProof() {
  const institutions = ['Peking University', 'Tsinghua', 'Fudan', 'MIT', 'Stanford', 'Oxford']
  return (
    <section className="border-y border-white/10 py-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <p
          className="text-[#606060] text-center mb-6"
          style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Trusted by researchers at
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
          {institutions.map((name) => (
            <span
              key={name}
              className="text-sm font-normal transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: '10,000+', label: '文献已处理' },
    { value: '< 30s', label: '每篇平均分析时间' },
    { value: '95%+', label: '元数据提取准确率' },
    { value: '100%', label: '数据本地存储' },
  ]
  return (
    <section className="bg-[#181818] py-16 border-b border-white/10" id="demo">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div
              className="text-white font-normal mb-2"
              style={{
                fontSize: 'clamp(28px, 3.5vw, 52px)',
                letterSpacing: '-1.5px',
                lineHeight: 1.1,
              }}
            >
              {value}
            </div>
            <div className="text-[#6c7584] text-sm">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Feature Visuals ───────────────────────────────────────────────
function AIVisual() {
  const fields = [
    { label: 'Research Method', value: '多模态深度学习框架，融合 CNN 视觉编码器与 Transformer 时序建模...' },
    { label: 'Main Conclusion', value: '在 COCO 数据集上超越 SOTA 3.2 mAP，推理速度提升 40%...' },
    { label: 'Innovation',      value: '提出自适应注意力门控机制，显著降低多模态特征的冗余噪声...' },
    { label: 'Keywords',        value: '目标检测, Transformer, 多尺度特征, 注意力机制' },
  ]
  return (
    <div className="w-full h-full p-8 flex flex-col justify-center gap-5">
      {fields.map(({ label, value }, i) => (
        <div key={label} style={{ opacity: 1 - i * 0.08 }}>
          <span
            className="text-[#298dff] block mb-1"
            style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            {label}
          </span>
          <span className="text-[#a8a8a8] text-xs leading-relaxed line-clamp-2">{value}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#298dff] animate-pulse" />
        <span className="text-[#606060]" style={{ fontSize: '10px' }}>DeepSeek AI · analyzing...</span>
      </div>
    </div>
  )
}

function IntegrationVisual() {
  const collections = [
    { name: 'Deep Learning', count: 34, active: true },
    { name: 'NLP', count: 28, active: false },
    { name: 'Computer Vision', count: 19, active: false },
    { name: 'Reinforcement Learning', count: 12, active: false },
  ]
  return (
    <div className="w-full h-full p-8 flex flex-col justify-center gap-2">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#298dff]" />
        <span className="text-white text-sm">My Library</span>
        <span className="text-[#606060] text-xs ml-auto" style={{ fontSize: '10px' }}>Zotero API · connected</span>
      </div>
      {collections.map(({ name, count, active }) => (
        <div
          key={name}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[7px] border transition-colors ${
            active ? 'bg-[#298dff]/10 border-[#298dff]/30' : 'border-transparent hover:border-white/10'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1.5 3.5h4l1 1.5h6v7h-11V3.5z"
              stroke={active ? '#298dff' : '#606060'}
              strokeWidth="1.2"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
          <span className={`text-sm flex-1 truncate ${active ? 'text-white' : 'text-[#a8a8a8]'}`}>{name}</span>
          <span className="text-[#606060] text-xs">{count}</span>
        </div>
      ))}
    </div>
  )
}

function ExportVisual() {
  const headers = ['标题', '作者', '年份', '研究方法', '结论']
  const rows = [
    ['Attention Is All You...', 'Vaswani et al.', '2017', 'Transformer 架构...', '超越 RNN...'],
    ['BERT: Pre-training...', 'Devlin et al.', '2018', '双向预训练...', 'GLUE SOTA...'],
    ['GPT-3: Language Models...', 'Brown et al.', '2020', '自回归生成...', '少样本学习...'],
  ]
  return (
    <div className="w-full h-full p-8 flex flex-col justify-center">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-2 py-2 text-[#298dff] font-normal border-b border-white/10 whitespace-nowrap"
                  style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/5">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-2 py-2 whitespace-nowrap max-w-[100px] truncate ${
                      j === 0 ? 'text-[#f0f0f0]' : 'text-[#6c7584]'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        <span className="text-[#606060]" style={{ fontSize: '10px' }}>Exported · literature_summary.xlsx</span>
        <span
          className="text-[#298dff] px-2 py-0.5 rounded-[4px]"
          style={{ fontSize: '10px', background: 'rgba(41,141,255,0.12)' }}
        >
          Done
        </span>
      </div>
    </div>
  )
}

// ── Features ──────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      eyebrow: 'AI Analysis',
      title: 'Extract insights\nautomatically.',
      body: '基于 DeepSeek AI，从 PDF 全文提取研究方法、主要结论与创新点，无需手动阅读。Zotero 中缺失的字段也由 AI 自动补全。',
      visual: <AIVisual />,
      flip: false,
    },
    {
      eyebrow: 'Zotero Integration',
      title: 'Works with your\nexisting library.',
      body: '直接连接 Zotero 本地 API，无需导出或迁移数据。支持所有集合类型、独立 PDF 附件，以及多层嵌套子集合。',
      visual: <IntegrationVisual />,
      flip: true,
    },
    {
      eyebrow: 'Structured Export',
      title: 'From library\nto spreadsheet.',
      body: '生成格式化的 Excel 文件，按集合分 Sheet。智能去重，支持增量更新——只分析新增文献，节省 AI 调用成本。',
      visual: <ExportVisual />,
      flip: false,
    },
  ]

  return (
    <section id="features" className="py-24 md:py-[160px] bg-black">
      <div className="max-w-[1200px] mx-auto px-6 space-y-24 md:space-y-40">
        {features.map(({ eyebrow, title, body, visual, flip }, i) => (
          <div
            key={i}
            className={`flex flex-col gap-12 md:gap-20 ${flip ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-[#298dff] mb-6"
                style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                {eyebrow}
              </p>
              <h2
                className="font-normal text-white leading-[1.08] mb-6 whitespace-pre-line"
                style={{
                  fontSize: 'clamp(32px, 5vw, 72px)',
                  letterSpacing: 'clamp(-1px, -0.25vw, -3px)',
                }}
              >
                {title}
              </h2>
              <p className="text-[#6c7584] text-[18px] leading-[1.35] max-w-[400px]">{body}</p>
            </div>
            <div className="flex-1 w-full max-w-[480px] aspect-[4/3] rounded-[7px] bg-[#181818] border border-white/10 overflow-hidden">
              {visual}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: '连接 Zotero', desc: '工具通过 localhost API 自动读取你的文献库和集合结构，无需任何配置。' },
    { num: '02', title: '选择集合', desc: '指定要处理的集合，支持批量多选和范围选取，自动跳过已分析的文献。' },
    { num: '03', title: 'AI 分析', desc: 'DeepSeek AI 读取 PDF 全文或摘要，提取结构化研究信息并补全缺失字段。' },
    { num: '04', title: '导出 Excel', desc: '按集合分 Sheet 输出格式化文件，支持续写已有文件，智能增量更新。' },
  ]

  return (
    <section id="how" className="bg-[#181818] py-24 md:py-[160px] border-y border-white/10">
      <div className="max-w-[1200px] mx-auto px-6">
        <p
          className="text-[#606060] mb-6"
          style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          How it works
        </p>
        <h2
          className="font-normal text-white mb-16 max-w-[480px]"
          style={{
            fontSize: 'clamp(32px, 5vw, 72px)',
            letterSpacing: 'clamp(-1px, -0.25vw, -3px)',
            lineHeight: 1.08,
          }}
        >
          Four steps to clarity.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="border-t border-white/10 pt-6">
              <div className="text-[#298dff] text-sm font-mono mb-4 tabular-nums">{num}</div>
              <div className="text-white text-base mb-3 font-normal">{title}</div>
              <div className="text-[#6c7584] text-sm leading-[1.5]">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────
function FinalCTA({ onGetStarted }) {
  return (
    <section className="bg-white py-24 md:py-[160px]">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2
          className="font-normal text-black mb-6 mx-auto"
          style={{
            fontSize: 'clamp(32px, 5.5vw, 84px)',
            letterSpacing: 'clamp(-1px, -0.3vw, -3.5px)',
            lineHeight: 1.08,
            maxWidth: '700px',
          }}
        >
          Start organizing your library today.
        </h2>
        <p className="text-[#606060] text-[18px] leading-[1.35] mb-10 max-w-[400px] mx-auto">
          开箱即用，连接本地 Zotero，10 分钟内完成第一批文献整理。
        </p>
        <button
          onClick={onGetStarted}
          className="bg-[#298dff] text-white text-[14px] font-normal px-6 py-3.5 rounded-[7px]
                     hover:brightness-110 transition-all duration-150
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#298dff]"
        >
          Get Started
        </button>
        <p className="text-[#a8a8a8] text-xs mt-4">
          开源免费 · 数据本地存储 · 无需注册账号
        </p>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────
function Footer() {
  const links = {
    Product: ['Features', 'How it works', 'Demo'],
    'Open Source': ['GitHub', 'Documentation', 'Changelog'],
  }

  return (
    <footer className="bg-[#0c0c0c] border-t border-white/10 py-14">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
          <div>
            <div className="text-white font-medium text-[15px] mb-2">ZotSort</div>
            <div className="text-[#6c7584] text-sm max-w-[200px] leading-[1.5]">
              AI-powered Zotero literature management.
            </div>
          </div>
          <div className="flex gap-16">
            {Object.entries(links).map(([group, items]) => (
              <div key={group}>
                <div
                  className="text-[#606060] mb-4"
                  style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  {group}
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((l) => (
                    <a
                      key={l}
                      href="#"
                      className="text-[#6c7584] text-sm hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between gap-3">
          <span className="text-[#606060] text-xs">© 2025 ZotSort. Open source under MIT License.</span>
          <span className="text-[#606060] text-xs">Built for researchers, by researchers.</span>
        </div>
      </div>
    </footer>
  )
}

// ── Landing (main export) ─────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const handleGetStarted = () => navigate('/app')

  return (
    <div className="bg-black min-h-screen">
      <Header onGetStarted={handleGetStarted} />
      <main>
        <Hero onGetStarted={handleGetStarted} />
        <SocialProof />
        <Stats />
        <Features />
        <HowItWorks />
        <FinalCTA onGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </div>
  )
}
