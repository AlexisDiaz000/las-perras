import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settings'
import { UserCircleIcon, ShoppingBagIcon, TruckIcon } from '@heroicons/react/24/outline'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { MouseEvent } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  
  const appName = settings?.app_name || 'Brutal System'

  // Mouse tracking for background interaction
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    // Calculate relative position (-0.5 to 0.5)
    const x = (clientX / innerWidth) - 0.5
    const y = (clientY / innerHeight) - 0.5
    // Increase the multiplier for a more noticeable effect
    mouseX.set(x * 300) 
    mouseY.set(y * 300)
  }

  return (
    <div 
      className="min-h-screen bg-[color:var(--app-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background decorations with interactive movement */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ x: mouseX, y: mouseY }}
          transition={{ duration: 1.5, ease: "easeOut", x: { type: "spring", stiffness: 30, damping: 15 }, y: { type: "spring", stiffness: 30, damping: 15 } }}
          className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-primary-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ x: useMotionTemplate`calc(${mouseX}px * -0.8)`, y: useMotionTemplate`calc(${mouseY}px * -0.8)` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2, x: { type: "spring", stiffness: 20, damping: 20 }, y: { type: "spring", stiffness: 20, damping: 20 } }}
          className="absolute bottom-[10%] right-[10%] w-[40rem] h-[40rem] bg-red-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      {/* Login Button (Absolute position outside the main card) */}
      <motion.button 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/login')}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 text-[color:var(--app-muted-2)] hover:text-[color:var(--app-text)] transition-colors group bg-[color:var(--brand-surface)]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[color:var(--app-border)] shadow-sm"
      >
        <span className="text-xs font-bold tracking-widest uppercase hidden sm:block">Inicio (Staff)</span>
        <UserCircleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl bg-[color:var(--brand-surface)]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-[color:var(--app-border)] p-8 md:p-12 relative z-10"
      >
        
        {/* Header: Logo/Name */}
        <div className="flex justify-center items-center mb-16">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          >
            {settings?.logo_url && (
              <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[color:var(--app-border)] shadow-md shrink-0">
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="brand-logo text-4xl md:text-5xl text-[color:var(--app-text)] bg-clip-text text-transparent bg-gradient-to-br from-[color:var(--app-text)] to-[color:var(--app-muted-2)]">
              {appName}
            </h1>
          </motion.div>
        </div>

        {/* Main Actions */}
        <div className="space-y-10 max-w-md mx-auto">
          
          {/* Order Here */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4"
          >
            <h2 className="brand-logo text-3xl md:text-4xl text-[color:var(--app-text)]">Tu pedido aquí!</h2>
            <button 
              onClick={() => navigate('/menu?type=local')}
              className="w-full py-6 rounded-2xl border-2 border-[color:var(--app-text)] hover:bg-[color:var(--app-hover-strong)] transition-all group flex items-center justify-center gap-4 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <ShoppingBagIcon className="w-8 h-8 text-[color:var(--app-text)] group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold text-[color:var(--app-text)] uppercase tracking-wider">Para Comer Aquí</span>
            </button>
          </motion.div>

          {/* Order Delivery */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-4"
          >
            <h2 className="brand-logo text-2xl md:text-3xl text-[color:var(--app-text)]">Tu pedido a domicilio</h2>
            <button 
              onClick={() => navigate('/menu?type=delivery')}
              className="w-full py-5 rounded-2xl border-2 border-[color:var(--app-muted-2)] text-[color:var(--app-muted-2)] hover:border-[color:var(--app-text)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-hover)] transition-all group flex items-center justify-center gap-4 hover:shadow-lg hover:-translate-y-1"
            >
              <TruckIcon className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
              <span className="text-lg font-bold uppercase tracking-wider">A Domicilio</span>
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}
