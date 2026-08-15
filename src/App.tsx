import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Database,
  Edit3,
  Filter,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Monitor,
  Moon,
  PieChart as PieChartIcon,
  PiggyBank,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  TrendingUp,
  Unlock,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { hasSupabaseConfig, supabase } from './lib/supabase'
import './App.css'

// const expenseCategories = [
//   'Comida',
//   'Transporte',
//   'Vivienda',
//   'Servicios',
//   'Entretenimiento',
//   'Salud',
//   'Otros',
// ] as const
const expenseCategories = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Compras',
  'Educación',
  'Viajes',
  'Mascotas',
  'Deudas',
  'Ahorro',
  'TDC',
  'Otros',
] as const

const movementCategories = ['Todas', 'Ingreso', ...expenseCategories] as const
const movementTypes = ['Todos', 'Ingresos', 'Gastos'] as const
const currencies = ['MXN', 'USD'] as const

const dashboardModules = [
  {
    id: 'overview',
    label: 'Resumen',
    mobileLabel: 'Resumen',
    detail: 'Saldo y gastos',
    icon: LayoutDashboard,
  },
  {
    id: 'movement',
    label: 'Movimiento',
    mobileLabel: 'Movim.',
    detail: 'Ingresos y gastos',
    icon: Plus,
  },
  {
    id: 'budget',
    label: 'Presupuesto',
    mobileLabel: 'Presup.',
    detail: 'Limite mensual',
    icon: Lock,
  },
  {
    id: 'savings',
    label: 'Apartados',
    mobileLabel: 'Ahorro',
    detail: 'Dinero reservado',
    icon: PiggyBank,
  },
  {
    id: 'projection',
    label: 'Proyeccion',
    mobileLabel: 'Futuro',
    detail: 'Vision futura',
    icon: TrendingUp,
  },
  {
    id: 'charts',
    label: 'Graficas',
    mobileLabel: 'Graficas',
    detail: 'Analisis visual',
    icon: BarChart3,
  },
  {
    id: 'history',
    label: 'Historial',
    mobileLabel: 'Historial',
    detail: 'Filtros y edicion',
    icon: Search,
  },
] as const

type DashboardModule = (typeof dashboardModules)[number]['id']
type ExpenseCategory = (typeof expenseCategories)[number]
type CategoryFilter = (typeof movementCategories)[number]
type MovementFilter = (typeof movementTypes)[number]
type MovementType = 'income' | 'expense'
type MovementCategory = ExpenseCategory | 'Ingreso'
type Currency = (typeof currencies)[number]
type AuthMode = 'login' | 'signup'
type ThemePreference = 'light' | 'dark' | 'system'

type Movement = {
  id: string
  type: MovementType
  amount: number
  currency: Currency
  exchangeRate: number
  convertedToMxn: boolean
  mxnAmount: number
  usdAmount: number
  category: MovementCategory
  description: string
  date: string
  notes: string
}

type MovementForm = {
  type: MovementType
  amount: string
  currency: Currency
  exchangeRate: string
  convertedToMxn: boolean
  category: ExpenseCategory
  description: string
  date: string
  notes: string
}

type MovementRow = {
  id: string
  type: MovementType
  amount: number | string
  currency: Currency | null
  exchange_rate: number | string | null
  converted_to_mxn: boolean | null
  category: MovementCategory
  description: string
  movement_date: string
  notes: string | null
}

type SavingsReserve = {
  id: string
  name: string
  amount: number
  currency: Currency
  notes: string
  createdAt: string
}

type SavingsForm = {
  name: string
  amount: string
  currency: Currency
  notes: string
}

type SavingsReserveRow = {
  id: string
  name: string
  amount: number | string
  currency: Currency | null
  notes: string | null
  created_at: string
}

type BudgetRow = {
  id: string
  amount: number | string
  budget_month: string
}

// const categoryColors: Record<MovementCategory, string> = {
//   Ingreso: '#15803d',
//   Comida: '#f97316',
//   Transporte: '#2563eb',
//   Vivienda: '#7c3aed',
//   Servicios: '#0891b2',
//   Entretenimiento: '#db2777',
//   Salud: '#dc2626',
//   Otros: '#64748b',
// }
const categoryColors: Record<MovementCategory, string> = {
  Ingreso: '#15803d',

  Comida: '#f97316',
  Transporte: '#2563eb',
  Vivienda: '#7c3aed',
  Servicios: '#0891b2',
  Entretenimiento: '#db2777',
  Salud: '#dc2626',

  Compras: '#9333ea',
  Educación: '#0ea5e9',
  Viajes: '#14b8a6',
  Mascotas: '#a16207',
  Deudas: '#b91c1c',
  Ahorro: '#16a34a',
  TDC: '#ff00b3',

  Otros: '#64748b',
}

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }),
  MXN: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }),
}

const compactCurrencyFormatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
  MXN: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function toInputDate(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function createDefaultForm(): MovementForm {
  return {
    type: 'expense',
    amount: '',
    currency: 'MXN',
    exchangeRate: '',
    convertedToMxn: false,
    category: 'Comida',
    description: '',
    date: toInputDate(),
    notes: '',
  }
}

function createDefaultSavingsForm(): SavingsForm {
  return {
    name: '',
    amount: '',
    currency: 'MXN',
    notes: '',
  }
}

function parseNumberInput(value: string) {
  return Number(value.trim().replace(',', '.'))
}

function parseOptionalMoneyInput(value: string) {
  if (!value.trim()) {
    return null
  }

  const amount = parseNumberInput(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function clampWholeNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function parseLocalDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? 6 : day - 1
  start.setDate(start.getDate() - diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function isSameDay(dateString: string, compareDate: Date) {
  return dateString === toInputDate(compareDate)
}

function isSameMonth(dateString: string, compareDate: Date) {
  const date = parseLocalDate(dateString)
  return (
    date.getMonth() === compareDate.getMonth() &&
    date.getFullYear() === compareDate.getFullYear()
  )
}

function normalizeCurrency(value: string | null): Currency {
  return value === 'MXN' ? 'MXN' : 'USD'
}

function getMxnAmount(
  amount: number,
  currency: Currency,
  exchangeRate: number,
  convertedToMxn: boolean,
) {
  if (currency === 'MXN') {
    return amount
  }

  return convertedToMxn ? amount * exchangeRate : 0
}

function getUsdAmount(amount: number, currency: Currency, convertedToMxn: boolean) {
  if (currency === 'USD' && !convertedToMxn) {
    return amount
  }

  return 0
}

function formatCurrency(value: number, currency: Currency = 'MXN') {
  return `${currencyFormatters[currency].format(value)} ${currency}`
}

function compactCurrency(value: number, currency: Currency = 'MXN') {
  return compactCurrencyFormatters[currency].format(value)
}

function formatDate(dateString: string) {
  return dateFormatter.format(parseLocalDate(dateString))
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthStart(date: Date) {
  return `${getMonthKey(date)}-01`
}

function getMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date)
  return `${label.charAt(0).toUpperCase()}${label.slice(1).replace('.', '')}`
}

function mapMovementRow(row: MovementRow): Movement {
  const amount = Number(row.amount)
  const currency = normalizeCurrency(row.currency)
  const convertedToMxn = currency === 'USD' && Boolean(row.converted_to_mxn)
  const exchangeRate =
    currency === 'USD' && convertedToMxn ? Number(row.exchange_rate) || 1 : 1

  return {
    id: row.id,
    type: row.type,
    amount,
    currency,
    exchangeRate,
    convertedToMxn,
    mxnAmount: getMxnAmount(amount, currency, exchangeRate, convertedToMxn),
    usdAmount: getUsdAmount(amount, currency, convertedToMxn),
    category: row.category,
    description: row.description,
    date: row.movement_date,
    notes: row.notes ?? '',
  }
}

function mapSavingsReserveRow(row: SavingsReserveRow): SavingsReserve {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    currency: normalizeCurrency(row.currency),
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return 'Ocurrio un error inesperado.'
}

const SESSION_REFRESH_MARGIN_SECONDS = 180
const themeStorageKey = 'finanzas-theme'

const themeOptions: Array<{
  value: ThemePreference
  label: string
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
]

function getInitialThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey)
  if (
    storedTheme === 'light' ||
    storedTheme === 'dark' ||
    storedTheme === 'system'
  ) {
    return storedTheme
  }

  return 'system'
}

function isSessionTokenError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('jwt') ||
    message.includes('token has expired') ||
    message.includes('invalid token') ||
    (message.includes('session') && message.includes('expired'))
  )
}

function MetricCard({
  title,
  value,
  secondaryValue,
  detail,
  icon,
  tone,
}: {
  title: string
  value: string
  secondaryValue?: string
  detail: string
  icon: ReactNode
  tone: 'green' | 'red' | 'blue' | 'amber'
}) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <p>{title}</p>
      <div className="metric-values">
        <strong>{value}</strong>
        {secondaryValue && <strong>{secondaryValue}</strong>}
      </div>
      <span>{detail}</span>
    </article>
  )
}

function SetupPanel() {
  return (
    <main className="auth-shell">
      <section className="auth-panel setup-panel">
        <div className="auth-brand">
          <Database aria-hidden="true" />
          <div>
            <span className="eyebrow">Configuracion requerida</span>
            <h1>Conecta Supabase para activar login y base de datos.</h1>
          </div>
        </div>
        <p>
          Crea un archivo <code>.env.local</code> con tus credenciales de
          Supabase. Puedes usar <code>.env.example</code> como plantilla.
        </p>
        <pre>
          <code>
            VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co{'\n'}
            VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
          </code>
        </pre>
        <p>
          Luego ejecuta el SQL de <code>supabase/schema.sql</code> en Supabase
          SQL Editor y reinicia el servidor de desarrollo.
        </p>
      </section>
    </main>
  )
}

function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')

    if (!supabase) {
      setAuthError('Falta configurar Supabase.')
      return
    }

    if (password.length < 6) {
      setAuthError('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const response =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password })

      if (response.error) {
        throw response.error
      }

      if (mode === 'signup' && !response.data.session) {
        setAuthMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.')
      }
    } catch (error) {
      setAuthError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <ShieldCheck aria-hidden="true" />
          <div>
            <span className="eyebrow">Finanzas personales</span>
            <h1>{mode === 'login' ? 'Inicia sesion' : 'Crea tu cuenta'}</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          <label>
            Correo
            <span className="input-with-icon">
              <Mail aria-hidden="true" />
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label>
            Contrasena
            <span className="input-with-icon">
              <Lock aria-hidden="true" />
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </span>
          </label>

          {authError && <p className="field-error">{authError}</p>}
          {authMessage && <p className="field-success">{authMessage}</p>}

          <button type="submit" className="primary-action" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="spin" aria-hidden="true" />
            ) : mode === 'login' ? (
              <LogIn aria-hidden="true" />
            ) : (
              <UserPlus aria-hidden="true" />
            )}
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          type="button"
          className="link-action"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'signup' : 'login'))
            setAuthError('')
            setAuthMessage('')
          }}
        >
          {mode === 'login'
            ? 'No tengo cuenta, crear una'
            : 'Ya tengo cuenta, iniciar sesion'}
        </button>
      </section>
    </main>
  )
}

function LoadingScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-panel loading-panel">
        <Loader2 className="spin" aria-hidden="true" />
        <p>Preparando tus finanzas...</p>
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [movements, setMovements] = useState<Movement[]>([])
  const [savingsReserves, setSavingsReserves] = useState<SavingsReserve[]>([])
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [budgetError, setBudgetError] = useState('')
  const [form, setForm] = useState<MovementForm>(createDefaultForm)
  const [savingsForm, setSavingsForm] = useState<SavingsForm>(
    createDefaultSavingsForm,
  )
  const [formError, setFormError] = useState('')
  const [savingsError, setSavingsError] = useState('')
  const [appError, setAppError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSavingsId, setEditingSavingsId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Todas')
  const [typeFilter, setTypeFilter] = useState<MovementFilter>('Todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSavingMovement, setIsSavingMovement] = useState(false)
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const [isSavingReserve, setIsSavingReserve] = useState(false)
  const [activeModule, setActiveModule] = useState<DashboardModule>('overview')
  const [chartCurrency, setChartCurrency] = useState<Currency>('MXN')
  const [projectionMonths, setProjectionMonths] = useState('6')
  const [projectionMonthlyIncome, setProjectionMonthlyIncome] = useState('')
  const [projectionMonthlyExpenses, setProjectionMonthlyExpenses] = useState('')
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    getInitialThemePreference,
  )

  const [now, setNow] = useState(() => new Date())
  const weekStart = useMemo(() => startOfWeek(now), [now])
  const currentBudgetMonth = useMemo(() => getMonthStart(now), [now])
  const currentUser = session?.user ?? null

  useEffect(() => {
    const root = document.documentElement

    if (themePreference === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.dataset.theme = themePreference
    }

    window.localStorage.setItem(themeStorageKey, themePreference)
  }, [themePreference])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }

    let isActive = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return
      }

      if (error) {
        setAppError(error.message)
      }

      setSession(data.session)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAppError('')
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  async function ensureFreshSession(forceRefresh = false) {
    if (!supabase) {
      throw new Error('Falta configurar Supabase.')
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    const currentSession = sessionData.session
    if (!currentSession) {
      setSession(null)
      throw new Error('Tu sesion expiro. Inicia sesion nuevamente.')
    }

    const expiresAt = currentSession.expires_at ?? 0
    const secondsUntilExpiration = expiresAt - Math.floor(Date.now() / 1000)
    const shouldRefresh =
      forceRefresh ||
      !expiresAt ||
      secondsUntilExpiration <= SESSION_REFRESH_MARGIN_SECONDS

    if (!shouldRefresh) {
      return currentSession
    }

    const refreshOptions = currentSession.refresh_token
      ? { refresh_token: currentSession.refresh_token }
      : undefined
    const { data: refreshedData, error: refreshError } =
      await supabase.auth.refreshSession(refreshOptions)

    if (refreshError) {
      throw refreshError
    }

    if (!refreshedData.session) {
      setSession(null)
      throw new Error('Tu sesion expiro. Inicia sesion nuevamente.')
    }

    setSession(refreshedData.session)
    return refreshedData.session
  }

  useEffect(() => {
    if (!supabase || !currentUser) {
      setMovements([])
      setSavingsReserves([])
      setMonthlyBudget(0)
      setBudgetInput('')
      setBudgetId(null)
      setSavingsForm(createDefaultSavingsForm())
      setEditingSavingsId(null)
      return
    }

    void loadFinanceData(currentUser, currentBudgetMonth)
  }, [currentUser, currentBudgetMonth])

  useEffect(() => {
    if (!supabase || !currentUser) {
      return
    }

    const reloadAfterResume = () => {
      if (document.visibilityState !== 'visible') {
        return
      }

      const nextNow = new Date()
      setNow(nextNow)
      void loadFinanceData(currentUser, getMonthStart(nextNow))
    }

    document.addEventListener('visibilitychange', reloadAfterResume)
    window.addEventListener('focus', reloadAfterResume)

    return () => {
      document.removeEventListener('visibilitychange', reloadAfterResume)
      window.removeEventListener('focus', reloadAfterResume)
    }
  }, [currentUser])

  async function loadFinanceData(user: User, budgetMonth: string) {
    if (!supabase) {
      return
    }

    const client = supabase
    setIsLoadingData(true)
    setAppError('')

    try {
      const activeSession = await ensureFreshSession()
      let userId = activeSession.user.id || user.id
      const fetchFinanceRows = (nextUserId: string) =>
        Promise.all([
          client
            .from('movements')
            .select(
              'id,type,amount,currency,exchange_rate,converted_to_mxn,category,description,movement_date,notes',
            )
            .eq('user_id', nextUserId)
            .order('movement_date', { ascending: false })
            .order('created_at', { ascending: false }),
          client
            .from('monthly_budgets')
            .select('id,amount,budget_month')
            .eq('user_id', nextUserId)
            .eq('budget_month', budgetMonth)
            .maybeSingle(),
          client
            .from('savings_reserves')
            .select('id,name,amount,currency,notes,created_at')
            .eq('user_id', nextUserId)
            .order('created_at', { ascending: false }),
        ])

      let [movementsResponse, budgetResponse, savingsResponse] =
        await fetchFinanceRows(userId)
      const firstError =
        movementsResponse.error ?? budgetResponse.error ?? savingsResponse.error

      if (firstError && isSessionTokenError(firstError)) {
        const refreshedSession = await ensureFreshSession(true)
        userId = refreshedSession.user.id || userId
        const retriedResponses = await fetchFinanceRows(userId)
        movementsResponse = retriedResponses[0]
        budgetResponse = retriedResponses[1]
        savingsResponse = retriedResponses[2]
      }

      if (movementsResponse.error) {
        throw movementsResponse.error
      }

      if (budgetResponse.error) {
        throw budgetResponse.error
      }

      if (savingsResponse.error) {
        throw savingsResponse.error
      }

      const nextMovements = (movementsResponse.data ?? []).map((row) =>
        mapMovementRow(row as MovementRow),
      )
      const nextSavingsReserves = (savingsResponse.data ?? []).map((row) =>
        mapSavingsReserveRow(row as SavingsReserveRow),
      )
      const budget = budgetResponse.data as BudgetRow | null
      const nextBudget = budget ? Number(budget.amount) : 0

      setMovements(nextMovements)
      setSavingsReserves(nextSavingsReserves)
      setBudgetId(budget?.id ?? null)
      setMonthlyBudget(nextBudget)
      setBudgetInput(nextBudget > 0 ? String(nextBudget) : '')
    } catch (error) {
      setAppError(getErrorMessage(error))
    } finally {
      setIsLoadingData(false)
    }
  }

  const totals = useMemo(() => {
    return movements.reduce(
      (acc, movement) => {
        if (movement.type === 'income') {
          acc.incomeMxn += movement.mxnAmount
          acc.incomeUsd += movement.usdAmount
        } else {
          acc.expensesMxn += movement.mxnAmount
          acc.expensesUsd += movement.usdAmount
        }

        const movementDate = parseLocalDate(movement.date)
        if (
          movement.type === 'expense' &&
          isSameDay(movement.date, now)
        ) {
          acc.todayExpensesMxn += movement.mxnAmount
          acc.todayExpensesUsd += movement.usdAmount
        }

        if (
          movement.type === 'expense' &&
          movementDate >= weekStart
        ) {
          acc.weekExpensesMxn += movement.mxnAmount
          acc.weekExpensesUsd += movement.usdAmount
        }

        if (
          movement.type === 'expense' &&
          isSameMonth(movement.date, now)
        ) {
          acc.monthExpensesMxn += movement.mxnAmount
          acc.monthExpensesUsd += movement.usdAmount
        }

        return acc
      },
      {
        incomeMxn: 0,
        expensesMxn: 0,
        incomeUsd: 0,
        expensesUsd: 0,
        todayExpensesMxn: 0,
        todayExpensesUsd: 0,
        weekExpensesMxn: 0,
        weekExpensesUsd: 0,
        monthExpensesMxn: 0,
        monthExpensesUsd: 0,
      },
    )
  }, [movements, now, weekStart])

  const mxnBalance = totals.incomeMxn - totals.expensesMxn
  const usdBalance = totals.incomeUsd - totals.expensesUsd
  const savingsTotals = useMemo(() => {
    return savingsReserves.reduce(
      (acc, reserve) => {
        acc[reserve.currency] += reserve.amount
        return acc
      },
      { MXN: 0, USD: 0 } satisfies Record<Currency, number>,
    )
  }, [savingsReserves])
  const availableMxnBalance = mxnBalance - savingsTotals.MXN
  const availableUsdBalance = usdBalance - savingsTotals.USD
  const editingSavingsReserve = savingsReserves.find(
    (reserve) => reserve.id === editingSavingsId,
  )
  const availableForSavings =
    savingsForm.currency === 'MXN' ? availableMxnBalance : availableUsdBalance
  const editingSavingsAmount =
    editingSavingsReserve?.currency === savingsForm.currency
      ? editingSavingsReserve.amount
      : 0
  const budgetRemaining = monthlyBudget - totals.monthExpensesMxn
  const budgetUsed = monthlyBudget > 0 ? totals.monthExpensesMxn / monthlyBudget : 0
  const budgetProgress = Math.min(budgetUsed * 100, 100)
  const budgetIsClose = monthlyBudget > 0 && budgetUsed >= 0.85 && budgetUsed < 1
  const budgetIsExceeded = monthlyBudget > 0 && budgetUsed >= 1
  const formAmount = parseNumberInput(form.amount)
  const formExchangeRate = parseNumberInput(form.exchangeRate)
  const convertedMovementPreview =
    form.currency === 'USD' &&
    form.convertedToMxn &&
    Number.isFinite(formAmount) &&
    formAmount > 0 &&
    Number.isFinite(formExchangeRate) &&
    formExchangeRate > 0
      ? getMxnAmount(formAmount, form.currency, formExchangeRate, true)
      : null

  const monthlyChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      return {
        key: getMonthKey(date),
        mes: getMonthLabel(date),
        ingresos: 0,
        gastos: 0,
      }
    })

    movements.forEach((movement) => {
      const movementMonth = getMonthKey(parseLocalDate(movement.date))
      const month = months.find((item) => item.key === movementMonth)
      if (!month) {
        return
      }

      if (movement.type === 'income') {
        month.ingresos +=
          chartCurrency === 'MXN' ? movement.mxnAmount : movement.usdAmount
      } else {
        month.gastos +=
          chartCurrency === 'MXN' ? movement.mxnAmount : movement.usdAmount
      }
    })

    return months
  }, [movements, now, chartCurrency])

  const categoryChartData = useMemo(() => {
    return expenseCategories
      .map((category) => ({
        name: category,
        value: movements
          .filter(
            (movement) =>
              movement.type === 'expense' &&
              (chartCurrency === 'MXN'
                ? movement.mxnAmount > 0
                : movement.usdAmount > 0) &&
              movement.category === category &&
              isSameMonth(movement.date, now),
          )
          .reduce(
            (sum, movement) =>
              sum +
              (chartCurrency === 'MXN' ? movement.mxnAmount : movement.usdAmount),
            0,
          ),
      }))
      .filter((item) => item.value > 0)
  }, [movements, now, chartCurrency])

  const projectionDefaults = useMemo(() => {
    const currentMonthKey = getMonthKey(now)
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      return {
        key: getMonthKey(date),
        income: 0,
        expenses: 0,
      }
    })

    movements.forEach((movement) => {
      const movementMonth = getMonthKey(parseLocalDate(movement.date))
      const month = months.find((item) => item.key === movementMonth)
      if (!month) {
        return
      }

      if (movement.type === 'income') {
        month.income += movement.mxnAmount
      } else {
        month.expenses += movement.mxnAmount
      }
    })

    const completedMonths = months.filter((month) => month.key !== currentMonthKey)
    const incomeMonths =
      completedMonths.filter((month) => month.income > 0).length > 0
        ? completedMonths.filter((month) => month.income > 0)
        : months.filter((month) => month.income > 0)
    const expenseMonths =
      completedMonths.filter((month) => month.expenses > 0).length > 0
        ? completedMonths.filter((month) => month.expenses > 0)
        : months.filter((month) => month.expenses > 0)
    const averageIncome =
      incomeMonths.length > 0
        ? incomeMonths.reduce((sum, month) => sum + month.income, 0) /
          incomeMonths.length
        : 0
    const averageExpenses =
      expenseMonths.length > 0
        ? expenseMonths.reduce((sum, month) => sum + month.expenses, 0) /
          expenseMonths.length
        : 0

    return {
      monthlyIncome: averageIncome,
      monthlyExpenses: monthlyBudget > 0 ? monthlyBudget : averageExpenses,
    }
  }, [movements, monthlyBudget, now])

  const projectionMonthCount = clampWholeNumber(
    parseOptionalMoneyInput(projectionMonths) ?? 6,
    1,
    60,
  )
  const projectedMonthlyIncome =
    parseOptionalMoneyInput(projectionMonthlyIncome) ??
    projectionDefaults.monthlyIncome
  const projectedMonthlyExpenses =
    parseOptionalMoneyInput(projectionMonthlyExpenses) ??
    projectionDefaults.monthlyExpenses
  const projectedMonthlyFlow = projectedMonthlyIncome - projectedMonthlyExpenses

  const projectionChartData = useMemo(() => {
    return Array.from({ length: projectionMonthCount + 1 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() + index, 1)
      const year = String(date.getFullYear()).slice(2)

      return {
        month: index === 0 ? 'Hoy' : `${getMonthLabel(date)} ${year}`,
        saldo: availableMxnBalance + projectedMonthlyFlow * index,
      }
    })
  }, [availableMxnBalance, now, projectedMonthlyFlow, projectionMonthCount])

  const projectedFinalBalance =
    projectionChartData[projectionChartData.length - 1]?.saldo ?? availableMxnBalance
  const projectedBalanceChange = projectedFinalBalance - availableMxnBalance
  const projectedTotalWithSavings = projectedFinalBalance + savingsTotals.MXN
  const monthsUntilNegativeBalance =
    projectedMonthlyFlow < 0 && availableMxnBalance > 0
      ? Math.floor(availableMxnBalance / Math.abs(projectedMonthlyFlow))
      : null

  const filteredMovements = useMemo(() => {
    return movements
      .filter((movement) => {
        const matchesCategory =
          categoryFilter === 'Todas' || movement.category === categoryFilter
        const matchesType =
          typeFilter === 'Todos' ||
          (typeFilter === 'Ingresos' && movement.type === 'income') ||
          (typeFilter === 'Gastos' && movement.type === 'expense')
        const matchesFrom = !dateFrom || movement.date >= dateFrom
        const matchesTo = !dateTo || movement.date <= dateTo

        return matchesCategory && matchesType && matchesFrom && matchesTo
      })
      .toSorted((a, b) => b.date.localeCompare(a.date))
  }, [movements, categoryFilter, typeFilter, dateFrom, dateTo])

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !currentUser) {
      setFormError('Inicia sesion para guardar movimientos.')
      return
    }

    const amount = parseNumberInput(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Ingresa un monto mayor que cero.')
      return
    }

    const exchangeRate =
      form.currency === 'USD' && form.convertedToMxn
        ? parseNumberInput(form.exchangeRate)
        : 1
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      setFormError('Ingresa un tipo de cambio valido para convertir a pesos.')
      return
    }

    if (!form.date) {
      setFormError('Selecciona una fecha.')
      return
    }

    const category = form.type === 'income' ? 'Ingreso' : form.category
    const description =
      form.description.trim() ||
      (form.type === 'income' ? 'Ingreso registrado' : `Gasto en ${category}`)
    const convertedToMxn = form.currency === 'USD' && form.convertedToMxn
    const nextMxnAmount = getMxnAmount(
      amount,
      form.currency,
      exchangeRate,
      convertedToMxn,
    )
    const nextUsdAmount = getUsdAmount(amount, form.currency, convertedToMxn)

    if (form.type === 'expense') {
      const currentMovement = movements.find((movement) => movement.id === editingId)
      let baseMxnBalance = availableMxnBalance
      let baseUsdBalance = availableUsdBalance

      if (currentMovement) {
        if (currentMovement.type === 'income') {
          baseMxnBalance -= currentMovement.mxnAmount
          baseUsdBalance -= currentMovement.usdAmount
        } else {
          baseMxnBalance += currentMovement.mxnAmount
          baseUsdBalance += currentMovement.usdAmount
        }
      }

      const projectedMxnBalance = baseMxnBalance - nextMxnAmount
      const projectedUsdBalance = baseUsdBalance - nextUsdAmount

      if (nextMxnAmount > 0 && projectedMxnBalance < -0.009) {
        setFormError(
          `Saldo insuficiente en MXN. Disponible: ${formatCurrency(
            baseMxnBalance,
            'MXN',
          )}.`,
        )
        return
      }

      if (nextUsdAmount > 0 && projectedUsdBalance < -0.009) {
        setFormError(
          `Saldo insuficiente en USD. Disponible: ${formatCurrency(
            baseUsdBalance,
            'USD',
          )}.`,
        )
        return
      }
    }

    setIsSavingMovement(true)
    setFormError('')

    try {
      const activeSession = await ensureFreshSession()
      const activeUserId = activeSession.user.id || currentUser.id
      const payload = {
        user_id: activeUserId,
        type: form.type,
        amount,
        currency: form.currency,
        exchange_rate: exchangeRate,
        converted_to_mxn: convertedToMxn,
        category,
        description,
        movement_date: form.date,
        notes: form.notes.trim(),
      }
      const response = editingId
        ? await supabase
            .from('movements')
            .update(payload)
            .eq('id', editingId)
            .eq('user_id', activeUserId)
            .select(
              'id,type,amount,currency,exchange_rate,converted_to_mxn,category,description,movement_date,notes',
            )
            .single()
        : await supabase
            .from('movements')
            .insert(payload)
            .select(
              'id,type,amount,currency,exchange_rate,converted_to_mxn,category,description,movement_date,notes',
            )
            .single()

      if (response.error) {
        throw response.error
      }

      const savedMovement = mapMovementRow(response.data as MovementRow)

      setMovements((current) => {
        if (editingId) {
          return current.map((item) =>
            item.id === editingId ? savedMovement : item,
          )
        }

        return [savedMovement, ...current]
      })

      setEditingId(null)
      setForm(createDefaultForm())
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSavingMovement(false)
    }
  }

  async function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !currentUser) {
      setBudgetError('Inicia sesion para guardar presupuesto.')
      return
    }

    const amount = parseNumberInput(budgetInput)
    if (budgetInput && (!Number.isFinite(amount) || amount < 0)) {
      setBudgetError('El presupuesto debe ser cero o mayor.')
      return
    }

    setIsSavingBudget(true)
    setBudgetError('')

    try {
      const activeSession = await ensureFreshSession()
      const activeUserId = activeSession.user.id || currentUser.id
      const response = await supabase
        .from('monthly_budgets')
        .upsert(
          {
            id: budgetId ?? undefined,
            user_id: activeUserId,
            budget_month: currentBudgetMonth,
            amount: budgetInput ? amount : 0,
          },
          { onConflict: 'user_id,budget_month' },
        )
        .select('id,amount,budget_month')
        .single()

      if (response.error) {
        throw response.error
      }

      const budget = response.data as BudgetRow
      const nextBudget = Number(budget.amount)
      setBudgetId(budget.id)
      setMonthlyBudget(nextBudget)
      setBudgetInput(nextBudget > 0 ? String(nextBudget) : '')
    } catch (error) {
      setBudgetError(getErrorMessage(error))
    } finally {
      setIsSavingBudget(false)
    }
  }

  async function handleSavingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase || !currentUser) {
      setSavingsError('Inicia sesion para guardar apartados.')
      return
    }

    const amount = parseNumberInput(savingsForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setSavingsError('Ingresa un monto mayor que cero.')
      return
    }

    const currentReserve = savingsReserves.find(
      (reserve) => reserve.id === editingSavingsId,
    )
    const currentReservedInCurrency =
      currentReserve?.currency === savingsForm.currency ? currentReserve.amount : 0
    const reservedWithoutCurrent =
      savingsTotals[savingsForm.currency] - currentReservedInCurrency
    const balanceForCurrency =
      savingsForm.currency === 'MXN' ? mxnBalance : usdBalance
    const nextAvailable = balanceForCurrency - reservedWithoutCurrent - amount

    if (nextAvailable < -0.009) {
      setSavingsError(
        `No hay saldo suficiente en ${savingsForm.currency} para este apartado.`,
      )
      return
    }

    setIsSavingReserve(true)
    setSavingsError('')

    try {
      const activeSession = await ensureFreshSession()
      const activeUserId = activeSession.user.id || currentUser.id
      const payload = {
        user_id: activeUserId,
        name: savingsForm.name.trim() || 'Apartado',
        amount,
        currency: savingsForm.currency,
        notes: savingsForm.notes.trim(),
      }
      const response = editingSavingsId
        ? await supabase
            .from('savings_reserves')
            .update(payload)
            .eq('id', editingSavingsId)
            .eq('user_id', activeUserId)
            .select('id,name,amount,currency,notes,created_at')
            .single()
        : await supabase
            .from('savings_reserves')
            .insert(payload)
            .select('id,name,amount,currency,notes,created_at')
            .single()

      if (response.error) {
        throw response.error
      }

      const savedReserve = mapSavingsReserveRow(
        response.data as SavingsReserveRow,
      )

      setSavingsReserves((current) => {
        if (editingSavingsId) {
          return current.map((reserve) =>
            reserve.id === editingSavingsId ? savedReserve : reserve,
          )
        }

        return [savedReserve, ...current]
      })

      setEditingSavingsId(null)
      setSavingsForm(createDefaultSavingsForm())
    } catch (error) {
      setSavingsError(getErrorMessage(error))
    } finally {
      setIsSavingReserve(false)
    }
  }

  function editMovement(movement: Movement) {
    setEditingId(movement.id)
    setForm({
      type: movement.type,
      amount: String(movement.amount),
      currency: movement.currency,
      convertedToMxn: movement.convertedToMxn,
      exchangeRate:
        movement.currency === 'USD' && movement.convertedToMxn
          ? String(movement.exchangeRate)
          : '',
      category: expenseCategories.includes(movement.category as ExpenseCategory)
        ? (movement.category as ExpenseCategory)
        : 'Comida',
      description: movement.description,
      date: movement.date,
      notes: movement.notes,
    })
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function editSavingsReserve(reserve: SavingsReserve) {
    setEditingSavingsId(reserve.id)
    setSavingsForm({
      name: reserve.name,
      amount: String(reserve.amount),
      currency: reserve.currency,
      notes: reserve.notes,
    })
    setSavingsError('')
    setActiveModule('savings')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteMovement(id: string) {
    if (!supabase || !currentUser) {
      return
    }

    const shouldDelete = window.confirm('Eliminar este movimiento?')
    if (!shouldDelete) {
      return
    }

    try {
      const activeSession = await ensureFreshSession()
      const activeUserId = activeSession.user.id || currentUser.id
      const response = await supabase
        .from('movements')
        .delete()
        .eq('id', id)
        .eq('user_id', activeUserId)

      if (response.error) {
        throw response.error
      }

      setMovements((current) => current.filter((movement) => movement.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setForm(createDefaultForm())
      }
    } catch (error) {
      setAppError(getErrorMessage(error))
    }
  }

  async function deleteSavingsReserve(id: string) {
    if (!supabase || !currentUser) {
      return
    }

    const shouldDelete = window.confirm('Desapartar este dinero?')
    if (!shouldDelete) {
      return
    }

    try {
      const activeSession = await ensureFreshSession()
      const activeUserId = activeSession.user.id || currentUser.id
      const response = await supabase
        .from('savings_reserves')
        .delete()
        .eq('id', id)
        .eq('user_id', activeUserId)

      if (response.error) {
        throw response.error
      }

      setSavingsReserves((current) =>
        current.filter((reserve) => reserve.id !== id),
      )
      if (editingSavingsId === id) {
        setEditingSavingsId(null)
        setSavingsForm(createDefaultSavingsForm())
      }
    } catch (error) {
      setAppError(getErrorMessage(error))
    }
  }

  async function handleLogout() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
    setMovements([])
    setSavingsReserves([])
    setMonthlyBudget(0)
    setBudgetInput('')
    setBudgetId(null)
    setEditingId(null)
    setEditingSavingsId(null)
    setForm(createDefaultForm())
    setSavingsForm(createDefaultSavingsForm())
  }

  function clearFilters() {
    setCategoryFilter('Todas')
    setTypeFilter('Todos')
    setDateFrom('')
    setDateTo('')
  }

  function selectModule(moduleId: DashboardModule) {
    setActiveModule(moduleId)

    if (window.matchMedia('(min-width: 981px)').matches) {
      document
        .getElementById(`module-${moduleId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!hasSupabaseConfig) {
    return <SetupPanel />
  }

  if (!authReady) {
    return <LoadingScreen />
  }

  if (!currentUser) {
    return <AuthPanel />
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Modulos de finanzas">
        <div className="sidebar-brand">
          <Wallet aria-hidden="true" />
          <div>
            <strong>Finanzas</strong>
            <span>Panel personal</span>
          </div>
        </div>

        <nav className="module-nav">
          {dashboardModules.map((module) => {
            const ModuleIcon = module.icon

            return (
              <button
                key={module.id}
                type="button"
                className={activeModule === module.id ? 'active' : ''}
                aria-current={activeModule === module.id ? 'page' : undefined}
                onClick={() => selectModule(module.id)}
              >
                <ModuleIcon aria-hidden="true" />
                <span>
                  <strong>{module.label}</strong>
                  <small>{module.detail}</small>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">Finanzas personales</span>
          <h1>Control claro de ingresos, gastos y presupuesto.</h1>
        </div>
        <div className="header-stack">
          <div className="account-card">
            <span>{currentUser.email}</span>
            <div className="account-actions">
              <div className="theme-switcher" aria-label="Tema de la interfaz">
                {themeOptions.map((option) => {
                  const ThemeIcon = option.icon

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        themePreference === option.value ? 'active' : ''
                      }
                      title={option.label}
                      onClick={() => setThemePreference(option.value)}
                    >
                      <ThemeIcon aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                className="icon-button ghost"
                onClick={handleLogout}
              >
                <LogOut aria-hidden="true" />
                Salir
              </button>
            </div>
          </div>
          <div className="header-balance">
            <Wallet aria-hidden="true" />
            <span>Saldo disponible (MXN)</span>
            <strong>{formatCurrency(availableMxnBalance, 'MXN')}</strong>
          </div>
          <div className="header-balance usd-balance">
            <CircleDollarSign aria-hidden="true" />
            <span>Dolares (USD)</span>
            <strong>{formatCurrency(availableUsdBalance, 'USD')}</strong>
          </div>
        </div>
      </header>

      {isLoadingData && (
        <section className="sync-status" role="status">
          <Loader2 className="spin" aria-hidden="true" />
          Sincronizando datos...
        </section>
      )}

      {appError && (
        <section className="budget-alert danger" role="status">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>No se pudo completar la operacion</strong>
            <p>{appError}</p>
          </div>
        </section>
      )}

      <nav className="mobile-module-nav" aria-label="Modulos de finanzas">
        {dashboardModules.map((module) => {
          const ModuleIcon = module.icon

          return (
            <button
              key={module.id}
              type="button"
              className={activeModule === module.id ? 'active' : ''}
              aria-current={activeModule === module.id ? 'page' : undefined}
              onClick={() => selectModule(module.id)}
            >
              <ModuleIcon aria-hidden="true" />
              <span>{module.mobileLabel}</span>
            </button>
          )
        })}
      </nav>

      <section
        id="module-overview"
        className={`dashboard-module module-overview ${
          activeModule === 'overview' ? 'active' : ''
        }`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Resumen financiero</h2>
          </div>
        </div>

        <section className="metrics-grid" aria-label="Resumen financiero">
          <MetricCard
            title="Ingresos"
            value={formatCurrency(totals.incomeMxn, 'MXN')}
            secondaryValue={formatCurrency(totals.incomeUsd, 'USD')}
            detail="MXN / USD"
            icon={<ArrowUpCircle aria-hidden="true" />}
            tone="green"
          />
          <MetricCard
            title="Gastos del dia"
            value={formatCurrency(totals.todayExpensesMxn, 'MXN')}
            secondaryValue={formatCurrency(totals.todayExpensesUsd, 'USD')}
            detail={formatDate(toInputDate(now))}
            icon={<CalendarDays aria-hidden="true" />}
            tone="red"
          />
          <MetricCard
            title="Gastos semana"
            value={formatCurrency(totals.weekExpensesMxn, 'MXN')}
            secondaryValue={formatCurrency(totals.weekExpensesUsd, 'USD')}
            detail={`Desde ${formatDate(toInputDate(weekStart))}`}
            icon={<ArrowDownCircle aria-hidden="true" />}
            tone="blue"
          />
          <MetricCard
            title="Gastos mes"
            value={formatCurrency(totals.monthExpensesMxn, 'MXN')}
            secondaryValue={formatCurrency(totals.monthExpensesUsd, 'USD')}
            detail="Mes actual"
            icon={<CircleDollarSign aria-hidden="true" />}
            tone="amber"
          />
        </section>

        {(budgetIsClose || budgetIsExceeded) && (
          <section
            className={`budget-alert ${budgetIsExceeded ? 'danger' : 'warning'}`}
            role="status"
          >
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>
                {budgetIsExceeded
                  ? 'Presupuesto mensual superado'
                  : 'Estas cerca de superar tu presupuesto'}
              </strong>
              <p>
                Has usado {Math.round(budgetUsed * 100)}% de tu presupuesto de
                este mes.
              </p>
            </div>
          </section>
        )}
      </section>

      <section
        id="module-movement"
        className={`dashboard-module ${activeModule === 'movement' ? 'active' : ''}`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Registrar movimiento</h2>
          </div>
        </div>

        <form className="panel movement-form" onSubmit={handleMovementSubmit}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Movimiento</span>
              <h2>{editingId ? 'Editar movimiento' : 'Registrar movimiento'}</h2>
            </div>
            {editingId && (
              <button
                type="button"
                className="icon-button ghost"
                aria-label="Cancelar edicion"
                title="Cancelar edicion"
                onClick={() => {
                  setEditingId(null)
                  setForm(createDefaultForm())
                  setFormError('')
                }}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="segmented" aria-label="Tipo de movimiento">
            <button
              type="button"
              className={form.type === 'income' ? 'active' : ''}
              onClick={() => setForm((current) => ({ ...current, type: 'income' }))}
            >
              <ArrowUpCircle aria-hidden="true" />
              Ingreso
            </button>
            <button
              type="button"
              className={form.type === 'expense' ? 'active' : ''}
              onClick={() => setForm((current) => ({ ...current, type: 'expense' }))}
            >
              <ArrowDownCircle aria-hidden="true" />
              Gasto
            </button>
          </div>

          <div className="amount-currency-row">
            <label>
              Monto
              <input
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                type="text"
                placeholder="0.00"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Moneda
              <select
                value={form.currency}
                onChange={(event) => {
                  const nextCurrency = event.target.value as Currency

                  setForm((current) => ({
                    ...current,
                    currency: nextCurrency,
                    convertedToMxn:
                      nextCurrency === 'USD' ? current.convertedToMxn : false,
                    exchangeRate:
                      nextCurrency === 'USD' && current.convertedToMxn
                        ? current.exchangeRate
                        : '',
                  }))
                }}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.currency === 'USD' && (
            <div className="segmented currency-mode" aria-label="Manejo de dolares">
              <button
                type="button"
                className={!form.convertedToMxn ? 'active' : ''}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    convertedToMxn: false,
                    exchangeRate: '',
                  }))
                }
              >
                <Wallet aria-hidden="true" />
                Mantener USD
              </button>
              <button
                type="button"
                className={form.convertedToMxn ? 'active' : ''}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    convertedToMxn: true,
                  }))
                }
              >
                <CircleDollarSign aria-hidden="true" />
                Convertir a MXN
              </button>
            </div>
          )}

          {form.currency === 'USD' && form.convertedToMxn && (
            <label className="exchange-rate-field">
              Tipo de cambio
              <input
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                type="text"
                placeholder="MXN por 1 USD"
                value={form.exchangeRate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    exchangeRate: event.target.value,
                  }))
                }
              />
              <span>Ejemplo: si 1 USD = 17 pesos, escribe 17.</span>
            </label>
          )}

          {convertedMovementPreview !== null && (
            <p className="conversion-preview">
              Se sumara como {formatCurrency(convertedMovementPreview, 'MXN')} al
              saldo en pesos.
            </p>
          )}

          {form.currency === 'USD' && !form.convertedToMxn && (
            <p className="conversion-preview">
              Se mantendra en tu saldo de dolares y no afectara el presupuesto
              en pesos.
            </p>
          )}

          {form.type === 'expense' && (
            <label>
              Categoria
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as ExpenseCategory,
                  }))
                }
              >
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Descripcion
            <input
              type="text"
              placeholder="Ej. Supermercado, renta, salario"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
            />
          </label>

          <label>
            Notas
            <textarea
              rows={3}
              placeholder="Opcional"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>

          {formError && <p className="field-error">{formError}</p>}

          <button type="submit" className="primary-action" disabled={isSavingMovement}>
            {isSavingMovement ? (
              <Loader2 className="spin" aria-hidden="true" />
            ) : editingId ? (
              <Save aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {editingId ? 'Guardar cambios' : 'Agregar movimiento'}
          </button>
        </form>
      </section>

      <section
        id="module-budget"
        className={`dashboard-module ${activeModule === 'budget' ? 'active' : ''}`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Presupuesto mensual</h2>
          </div>
        </div>

        <section className="panel budget-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Presupuesto</span>
              <h2>Presupuesto mensual</h2>
            </div>
            <PiggyBank aria-hidden="true" />
          </div>

          <form className="budget-form" onSubmit={handleBudgetSubmit}>
            <label>
              Limite del mes (MXN)
              <input
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                type="text"
                placeholder="0.00"
                value={budgetInput}
                onChange={(event) => setBudgetInput(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="secondary-action"
              disabled={isSavingBudget}
            >
              {isSavingBudget ? (
                <Loader2 className="spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              Guardar
            </button>
          </form>
          {budgetError && <p className="field-error">{budgetError}</p>}

          <div className="budget-readout">
            <span>Disponible del presupuesto (MXN)</span>
            <strong>{formatCurrency(budgetRemaining, 'MXN')}</strong>
          </div>
          <div className="progress-track" aria-label="Uso del presupuesto mensual">
            <span style={{ width: `${budgetProgress}%` }} />
          </div>
          <div className="budget-meta">
            <span>Usado: {formatCurrency(totals.monthExpensesMxn, 'MXN')}</span>
            <span>
              {monthlyBudget > 0
                ? `${Math.round(budgetUsed * 100)}%`
                : 'Sin presupuesto'}
            </span>
          </div>
        </section>
      </section>

      <section
        id="module-savings"
        className={`dashboard-module ${activeModule === 'savings' ? 'active' : ''}`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Apartados</h2>
          </div>
        </div>

        <section className="savings-layout">
          <form className="panel savings-form" onSubmit={handleSavingsSubmit}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Ahorro</span>
                <h2>{editingSavingsId ? 'Editar apartado' : 'Crear apartado'}</h2>
              </div>
              {editingSavingsId ? (
                <button
                  type="button"
                  className="icon-button ghost"
                  aria-label="Cancelar edicion de apartado"
                  title="Cancelar edicion"
                  onClick={() => {
                    setEditingSavingsId(null)
                    setSavingsForm(createDefaultSavingsForm())
                    setSavingsError('')
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              ) : (
                <Lock aria-hidden="true" />
              )}
            </div>

            <label>
              Nombre
              <input
                type="text"
                placeholder="Ej. Emergencia, renta, viaje"
                value={savingsForm.name}
                onChange={(event) =>
                  setSavingsForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <div className="amount-currency-row">
              <label>
                Monto
                <input
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  type="text"
                  placeholder="0.00"
                  value={savingsForm.amount}
                  onChange={(event) =>
                    setSavingsForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Moneda
                <select
                  value={savingsForm.currency}
                  onChange={(event) =>
                    setSavingsForm((current) => ({
                      ...current,
                      currency: event.target.value as Currency,
                    }))
                  }
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Notas
              <textarea
                rows={3}
                placeholder="Opcional"
                value={savingsForm.notes}
                onChange={(event) =>
                  setSavingsForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>

            <p className="conversion-preview">
              Disponible para apartar:{' '}
              {formatCurrency(
                availableForSavings + editingSavingsAmount,
                savingsForm.currency,
              )}
            </p>

            {savingsError && <p className="field-error">{savingsError}</p>}

            <button
              type="submit"
              className="primary-action"
              disabled={isSavingReserve}
            >
              {isSavingReserve ? (
                <Loader2 className="spin" aria-hidden="true" />
              ) : editingSavingsId ? (
                <Save aria-hidden="true" />
              ) : (
                <Lock aria-hidden="true" />
              )}
              {editingSavingsId ? 'Guardar apartado' : 'Apartar dinero'}
            </button>
          </form>

          <section className="panel savings-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Reservado</span>
                <h2>Dinero apartado</h2>
              </div>
              <PiggyBank aria-hidden="true" />
            </div>

            <div className="savings-totals">
              <div>
                <span>Apartado MXN</span>
                <strong>{formatCurrency(savingsTotals.MXN, 'MXN')}</strong>
              </div>
              <div>
                <span>Apartado USD</span>
                <strong>{formatCurrency(savingsTotals.USD, 'USD')}</strong>
              </div>
            </div>

            <div className="savings-list">
              {savingsReserves.map((reserve) => (
                <article className="savings-item" key={reserve.id}>
                  <div>
                    <strong>{reserve.name}</strong>
                    <span>
                      {formatCurrency(reserve.amount, reserve.currency)}
                      {reserve.notes ? ` - ${reserve.notes}` : ''}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-button ghost"
                      aria-label="Editar apartado"
                      title="Editar apartado"
                      onClick={() => editSavingsReserve(reserve)}
                    >
                      <Edit3 aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button ghost"
                      aria-label="Desapartar dinero"
                      title="Desapartar"
                      onClick={() => deleteSavingsReserve(reserve.id)}
                    >
                      <Unlock aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
              {savingsReserves.length === 0 && (
                <div className="empty-chart savings-empty">
                  <Lock aria-hidden="true" />
                  <span>Sin dinero apartado</span>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>

      <section
        id="module-projection"
        className={`dashboard-module ${
          activeModule === 'projection' ? 'active' : ''
        }`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Vision economica futura</h2>
          </div>
        </div>

        <section className="metrics-grid projection-metrics" aria-label="Proyeccion financiera">
          <MetricCard
            title="Saldo proyectado"
            value={formatCurrency(projectedFinalBalance, 'MXN')}
            detail={`${projectionMonthCount} meses`}
            icon={<TrendingUp aria-hidden="true" />}
            tone={projectedBalanceChange >= 0 ? 'green' : 'red'}
          />
          <MetricCard
            title="Cambio estimado"
            value={formatCurrency(projectedBalanceChange, 'MXN')}
            detail="Contra saldo actual"
            icon={<CircleDollarSign aria-hidden="true" />}
            tone={projectedBalanceChange >= 0 ? 'green' : 'red'}
          />
          <MetricCard
            title="Flujo mensual"
            value={formatCurrency(projectedMonthlyFlow, 'MXN')}
            detail="Ingreso menos gasto"
            icon={<BarChart3 aria-hidden="true" />}
            tone={projectedMonthlyFlow >= 0 ? 'blue' : 'amber'}
          />
          <MetricCard
            title="Con apartados"
            value={formatCurrency(projectedTotalWithSavings, 'MXN')}
            detail="Saldo futuro + reservado"
            icon={<PiggyBank aria-hidden="true" />}
            tone="blue"
          />
        </section>

        {projectedFinalBalance < 0 && (
          <section className="budget-alert danger" role="status">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>Saldo proyectado negativo</strong>
              <p>
                Con este ritmo, el saldo podria quedar bajo cero
                {monthsUntilNegativeBalance !== null &&
                monthsUntilNegativeBalance <= projectionMonthCount
                  ? ` en aproximadamente ${monthsUntilNegativeBalance + 1} meses.`
                  : ' dentro del periodo seleccionado.'}
              </p>
            </div>
          </section>
        )}

        <section className="projection-layout">
          <section className="panel projection-controls">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Simulador</span>
                <h2>Variables mensuales</h2>
              </div>
              <TrendingUp aria-hidden="true" />
            </div>

            <div className="projection-form">
              <label>
                Meses a futuro
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={projectionMonths}
                  onChange={(event) => setProjectionMonths(event.target.value)}
                />
              </label>

              <label>
                Ingreso mensual (MXN)
                <input
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  type="text"
                  placeholder={
                    projectionDefaults.monthlyIncome > 0
                      ? String(Math.round(projectionDefaults.monthlyIncome))
                      : '0.00'
                  }
                  value={projectionMonthlyIncome}
                  onChange={(event) =>
                    setProjectionMonthlyIncome(event.target.value)
                  }
                />
              </label>

              <label>
                Gasto mensual (MXN)
                <input
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  type="text"
                  placeholder={
                    projectionDefaults.monthlyExpenses > 0
                      ? String(Math.round(projectionDefaults.monthlyExpenses))
                      : '0.00'
                  }
                  value={projectionMonthlyExpenses}
                  onChange={(event) =>
                    setProjectionMonthlyExpenses(event.target.value)
                  }
                />
              </label>
            </div>

            <div className="projection-summary">
              <div>
                <span>Saldo disponible hoy</span>
                <strong>{formatCurrency(availableMxnBalance, 'MXN')}</strong>
              </div>
              <div>
                <span>Ingreso usado</span>
                <strong>{formatCurrency(projectedMonthlyIncome, 'MXN')}</strong>
              </div>
              <div>
                <span>Gasto usado</span>
                <strong>{formatCurrency(projectedMonthlyExpenses, 'MXN')}</strong>
              </div>
            </div>
          </section>

          <article className="panel chart-panel projection-chart-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Proyeccion</span>
                <h2>Saldo estimado (MXN)</h2>
              </div>
              <TrendingUp aria-hidden="true" />
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => compactCurrency(Number(value), 'MXN')} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), 'MXN')} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo disponible"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </article>
        </section>
      </section>

      <section
        id="module-charts"
        className={`dashboard-module ${activeModule === 'charts' ? 'active' : ''}`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Graficas</h2>
          </div>
        </div>

        <div className="chart-toolbar" aria-label="Moneda de las graficas">
          <div className="segmented chart-currency-toggle">
            {currencies.map((currency) => (
              <button
                key={currency}
                type="button"
                className={chartCurrency === currency ? 'active' : ''}
                onClick={() => setChartCurrency(currency)}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>

        <section className="charts-grid" aria-label="Graficas de ingresos y gastos">
          <article className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Tendencia</span>
                <h2>Ingresos y gastos ({chartCurrency})</h2>
              </div>
              <CircleDollarSign aria-hidden="true" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis
                  tickFormatter={(value) =>
                    compactCurrency(Number(value), chartCurrency)
                  }
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), chartCurrency)}
                />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#15803d" radius={4} />
                <Bar dataKey="gastos" name="Gastos" fill="#dc2626" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Categorias</span>
                <h2>Gastos del mes ({chartCurrency})</h2>
              </div>
              <PieChartIcon aria-hidden="true" />
            </div>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={categoryColors[entry.name as ExpenseCategory]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value), chartCurrency)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <PieChartIcon aria-hidden="true" />
                <span>Sin gastos este mes en {chartCurrency}</span>
              </div>
            )}
          </article>
        </section>
      </section>

      <section
        id="module-history"
        className={`dashboard-module ${activeModule === 'history' ? 'active' : ''}`}
      >
        <div className="module-heading">
          <div>
            <span className="eyebrow">Modulo</span>
            <h2>Historial</h2>
          </div>
        </div>

        <section className="panel history-panel">
        <div className="panel-heading history-heading">
          <div>
            <span className="eyebrow">Historial</span>
            <h2>Movimientos registrados</h2>
          </div>
          <Search aria-hidden="true" />
        </div>

        <div className="filters-bar">
          <label>
            <Filter aria-hidden="true" />
            Tipo
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as MovementFilter)
              }
            >
              {movementTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Categoria
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as CategoryFilter)
              }
            >
              {movementCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Desde
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <button type="button" className="icon-button" onClick={clearFilters}>
            <X aria-hidden="true" />
            Limpiar
          </button>
        </div>

        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Monto original</th>
                <th aria-label="Acciones"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement.id}>
                  <td data-label="Fecha">{formatDate(movement.date)}</td>
                  <td data-label="Descripcion">
                    <strong>{movement.description}</strong>
                    {movement.notes && <span>{movement.notes}</span>}
                  </td>
                  <td data-label="Categoria">
                    <span
                      className="category-pill"
                      style={{ borderColor: categoryColors[movement.category] }}
                    >
                      {movement.category}
                    </span>
                  </td>
                  <td data-label="Tipo">
                    {movement.type === 'income' ? 'Ingreso' : 'Gasto'}
                  </td>
                  <td
                    data-label="Monto"
                    className={movement.type === 'income' ? 'money-in' : 'money-out'}
                  >
                    <strong>
                      {movement.type === 'income' ? '+' : '-'}
                      {formatCurrency(movement.amount, movement.currency)}
                    </strong>
                    {movement.currency === 'USD' && movement.convertedToMxn && (
                      <span>
                        Convertido a {formatCurrency(movement.mxnAmount, 'MXN')} -
                        TC{' '}
                        {movement.exchangeRate}
                      </span>
                    )}
                    {movement.currency === 'USD' && !movement.convertedToMxn && (
                      <span>Se mantiene en saldo USD.</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="icon-button ghost"
                      aria-label="Editar movimiento"
                      title="Editar movimiento"
                      onClick={() => editMovement(movement)}
                    >
                      <Edit3 aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button danger"
                      aria-label="Eliminar movimiento"
                      title="Eliminar movimiento"
                      onClick={() => deleteMovement(movement.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No hay movimientos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </section>
      </section>
      </div>
    </main>
  )
}

export default App
