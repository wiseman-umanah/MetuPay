// The signed-in home screen: a small bank-app dashboard. Everything except the name is demo data.
import { useState } from 'react'
import * as Icon from './icons.jsx'

const SERVICES = [
  ['To Bank', Icon.Bank], ['To MetuPay', Icon.Wallet], ['Airtime', Icon.Phone], ['Data', Icon.Wifi],
  ['Electricity', Icon.Bolt], ['TV', Icon.Tv], ['Savings', Icon.Piggy], ['More', Icon.Grid],
]
const ACTIVITY = [
  { title: 'Welcome bonus', when: 'Today, 09:41', amount: 2500, in: true },
  { title: 'Airtime · MTN', when: 'Yesterday, 18:20', amount: -1000 },
  { title: 'Transfer from Tunde A.', when: 'Mon, 12:05', amount: 45000, in: true },
  { title: 'Electricity · Ikeja', when: 'Sun, 08:30', amount: -15000 },
]
const naira = (n) => '₦' + Math.abs(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Dashboard({ name, onSignOut }) {
  const [hidden, setHidden] = useState(false)
  const first = name.split(' ')[0]
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="avatar" aria-hidden="true">{initials}</div>
        <div className="greet">
          <span className="muted">Welcome back</span>
          <strong>Hi, {first} 👋</strong>
        </div>
        <button className="icon-btn" aria-label="Notifications"><Icon.Bell /><span className="dot" /></button>
        <button className="icon-btn" aria-label="Sign out" title="Sign out" onClick={onSignOut}><Icon.LogOut /></button>
      </header>

      <section className="balance">
        <div className="balance-head">
          <span>Available balance</span>
          <button className="ghost" onClick={() => setHidden((h) => !h)} aria-label={hidden ? 'Show balance' : 'Hide balance'}>
            {hidden ? <Icon.EyeOff /> : <Icon.Eye />}
          </button>
          <span className="verified"><Icon.Shield /> FOID verified</span>
        </div>
        <div className="amount">{hidden ? '₦ • • • • • •' : naira(31500)}</div>
        <div className="balance-actions">
          <button><Icon.Plus /> Add money</button>
          <button><Icon.Send /> Transfer</button>
        </div>
      </section>

      <section className="services">
        {SERVICES.map(([label, Svg]) => (
          <button key={label} className="service">
            <span className="service-icon"><Svg /></span>
            {label}
          </button>
        ))}
      </section>

      <section className="promo">
        <div>
          <strong>Save daily, earn 15% p.a.</strong>
          <span>Start a MetuPay savings goal from ₦100.</span>
        </div>
        <span className="promo-icon"><Icon.Piggy /></span>
      </section>

      <section className="activity">
        <div className="activity-head"><strong>Recent activity</strong><button className="text-btn">See all</button></div>
        <ul>
          {ACTIVITY.map((t) => (
            <li key={t.title}>
              <span className={`tx-icon ${t.in ? 'in' : 'out'}`}>{t.in ? <Icon.ArrowIn /> : <Icon.ArrowOut />}</span>
              <div className="tx-body"><span>{t.title}</span><small>{t.when}</small></div>
              <span className={`tx-amt ${t.in ? 'in' : ''}`}>{hidden ? '••••' : (t.in ? '+' : '-') + naira(t.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav className="tabbar">
        {[['Home', Icon.Home], ['Cards', Icon.Card], ['Rewards', Icon.Gift], ['Me', Icon.User]].map(([label, Svg], i) => (
          <button key={label} className={i === 0 ? 'on' : ''}><Svg />{label}</button>
        ))}
      </nav>
    </div>
  )
}
