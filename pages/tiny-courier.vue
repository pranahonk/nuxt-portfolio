<template>
  <main class="mission-shell">
    <div class="grid-noise" aria-hidden="true" />

    <section v-if="authState !== 'authenticated'" class="login-stage">
      <div class="login-card">
        <div class="robot-mark" aria-hidden="true">
          <span class="antenna" />
          <span class="face"><i /><i /></span>
        </div>
        <p class="eyebrow">TINY COURIER / OPS</p>
        <h1>Mission Control</h1>
        <p class="login-copy">Private operations console for daytime development, builds, cards, and runner health.</p>
        <form @submit.prevent="login">
          <label for="mission-password">Operator password</label>
          <input
            id="mission-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="authState === 'loading'"
            placeholder="Enter password"
          >
          <p v-if="loginError" class="form-error" role="alert">{{ loginError }}</p>
          <button class="primary-button" type="submit" :disabled="authState === 'loading'">
            {{ authState === 'loading' ? 'Authenticating…' : 'Enter control room' }}
          </button>
        </form>
        <div class="security-note">
          <span class="pulse-dot" />
          Session secured with an HttpOnly cookie · 8 hour expiry
        </div>
      </div>
    </section>

    <template v-else>
      <header class="topbar">
        <div class="brand-lockup">
          <div class="mini-bot" aria-hidden="true"><i /><i /></div>
          <div>
            <p class="eyebrow">TINY COURIER / MISSION CONTROL</p>
            <h1>Day shift operations</h1>
          </div>
        </div>
        <div class="topbar-actions">
          <span class="sync-state" :class="freshnessClass">
            <span class="pulse-dot" />
            {{ freshnessLabel }}
          </span>
          <button class="icon-button" type="button" title="Refresh status" aria-label="Refresh status" @click="loadStatus">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
          </button>
          <button class="ghost-button" type="button" @click="logout">Sign out</button>
        </div>
      </header>

      <div v-if="apiError" class="alert-banner" role="alert">
        <strong>Telemetry interrupted.</strong> {{ apiError }}
      </div>

      <section class="status-ribbon" aria-label="System summary">
        <article>
          <span class="status-label">Coordinator</span>
          <strong :class="snapshot?.coordinator.paused ? 'danger-text' : 'success-text'">
            {{ snapshot?.coordinator.paused ? 'PAUSED' : 'ACTIVE' }}
          </strong>
          <small>{{ snapshot?.coordinator.nextRun || 'No next run' }}</small>
        </article>
        <article>
          <span class="status-label">Live runners</span>
          <strong>{{ onlineRunners }}/{{ snapshot?.runners.length || 0 }}</strong>
          <small>{{ busyRunners ? `${busyRunners} executing` : 'All standing by' }}</small>
        </article>
        <article>
          <span class="status-label">Ready queue</span>
          <strong>{{ readyCards.length }}</strong>
          <small>{{ runningCards.length }} running · {{ verificationCards.length }} verifying</small>
        </article>
        <article>
          <span class="status-label">Open PRs</span>
          <strong>{{ openPullRequests.length }}</strong>
          <small>{{ greenPullRequests }} green across checks</small>
        </article>
      </section>

      <section class="operator-strip">
        <div>
          <p class="eyebrow">OPERATOR ACTIONS</p>
          <h2>Control the development loop</h2>
        </div>
        <div class="operator-actions">
          <button
            v-if="snapshot?.coordinator.paused"
            class="action-button success-action"
            type="button"
            :disabled="commandBusy"
            @click="confirmCommand('resume')"
          >Resume automation</button>
          <button
            v-else
            class="action-button danger-action"
            type="button"
            :disabled="commandBusy"
            @click="confirmCommand('pause')"
          >Pause automation</button>
          <button class="action-button" type="button" :disabled="commandBusy || snapshot?.coordinator.paused" @click="confirmCommand('run_now')">
            Run next pass
          </button>
        </div>
      </section>

      <section class="dashboard-grid">
        <article class="panel queue-panel">
          <div class="panel-heading">
            <div><p class="eyebrow">WORKFLOW</p><h2>Work cards</h2></div>
            <span class="count-chip">{{ snapshot?.cards.length || 0 }} open</span>
          </div>
          <div class="card-list">
            <div v-for="card in snapshot?.cards || []" :key="card.number" class="work-card">
              <div class="work-card-main">
                <span class="issue-number">#{{ card.number }}</span>
                <a :href="card.url" target="_blank" rel="noreferrer">{{ card.title }}</a>
                <div class="label-row">
                  <span v-for="label in card.labels" :key="label" class="label-chip" :class="`label-${label}`">{{ label }}</span>
                </div>
              </div>
              <div class="card-actions">
                <button
                  v-if="card.labels.includes('backlog')"
                  type="button"
                  :disabled="commandBusy"
                  @click="confirmCommand('promote_ready', card.number)"
                >Mark ready</button>
                <button
                  v-if="card.labels.includes('ready')"
                  type="button"
                  :disabled="commandBusy"
                  @click="confirmCommand('move_backlog', card.number)"
                >Move back</button>
              </div>
            </div>
            <p v-if="!snapshot?.cards.length" class="empty-state">No open work cards.</p>
          </div>
        </article>

        <article class="panel pr-panel">
          <div class="panel-heading">
            <div><p class="eyebrow">DELIVERY</p><h2>Pull requests</h2></div>
            <span class="count-chip">review first</span>
          </div>
          <div class="pr-list">
            <a v-for="pr in snapshot?.pullRequests || []" :key="pr.number" :href="pr.url" target="_blank" rel="noreferrer" class="pr-row">
              <span class="pr-badge">PR {{ pr.number }}</span>
              <span class="pr-copy"><strong>{{ pr.title }}</strong><small>{{ pr.branch }}</small></span>
              <span class="check-state" :class="pr.checks === 'success' ? 'check-good' : 'check-warn'">{{ pr.checks }}</span>
            </a>
            <p v-if="!snapshot?.pullRequests.length" class="empty-state">No open pull requests.</p>
          </div>
        </article>

        <article class="panel host-panel">
          <div class="panel-heading"><div><p class="eyebrow">FLEET</p><h2>Host matrix</h2></div></div>
          <div class="host-grid">
            <div v-for="host in snapshot?.hosts || []" :key="host.name" class="host-card">
              <div class="host-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
              </div>
              <div><strong>{{ host.name }}</strong><small>{{ host.role }}</small></div>
              <span class="host-status" :class="host.status === 'online' ? 'status-online' : 'status-offline'">{{ host.status }}</span>
            </div>
          </div>
        </article>

        <article class="panel run-panel">
          <div class="panel-heading"><div><p class="eyebrow">PIPELINES</p><h2>Recent checks</h2></div></div>
          <div class="run-list">
            <a v-for="run in snapshot?.recentRuns || []" :key="`${run.name}-${run.createdAt}`" :href="run.url" target="_blank" rel="noreferrer" class="run-row">
              <span class="run-light" :class="run.conclusion === 'success' ? 'light-good' : run.status === 'in_progress' ? 'light-live' : 'light-bad'" />
              <span><strong>{{ run.name }}</strong><small>{{ formatTime(run.createdAt) }}</small></span>
              <b>{{ run.conclusion || run.status }}</b>
            </a>
          </div>
        </article>

        <article class="panel command-panel">
          <div class="panel-heading"><div><p class="eyebrow">AUDIT TRAIL</p><h2>Command queue</h2></div></div>
          <div class="command-list">
            <div v-for="command in commands" :key="command.id" class="command-row">
              <span class="command-state" :class="`command-${command.state}`" />
              <span><strong>{{ commandLabel(command.type) }}</strong><small>{{ command.issueNumber ? `Issue #${command.issueNumber} · ` : '' }}{{ formatTime(command.createdAt) }}</small></span>
              <b>{{ command.state }}</b>
            </div>
            <p v-if="!commands.length" class="empty-state">No commands have been issued.</p>
          </div>
        </article>
      </section>

      <footer class="mission-footer">
        <span>Schedule: weekdays 09:00–17:00 WIB · hourly bounded passes</span>
        <span>Never auto-merge · one low-risk card per pass</span>
      </footer>

      <div v-if="confirmation" class="modal-backdrop" @click.self="confirmation = null">
        <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <p class="eyebrow">CONFIRM OPERATOR ACTION</p>
          <h2 id="confirm-title">{{ confirmation.title }}</h2>
          <p>{{ confirmation.message }}</p>
          <div class="modal-actions">
            <button type="button" class="ghost-button" @click="confirmation = null">Cancel</button>
            <button type="button" class="primary-button" @click="sendConfirmedCommand">Confirm action</button>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
type CommandType = 'pause' | 'resume' | 'run_now' | 'promote_ready' | 'move_backlog'
interface Snapshot {
  generatedAt: string
  coordinator: { paused: boolean; service: string; timer: string; nextRun: string | null; activeRun: string | null; lastResult: string }
  runners: Array<{ name: string; status: string; busy: boolean }>
  cards: Array<{ number: number; title: string; labels: string[]; url: string }>
  pullRequests: Array<{ number: number; title: string; state: string; branch: string; url: string; checks: string }>
  recentRuns: Array<{ name: string; conclusion: string; status: string; url: string; createdAt: string }>
  hosts: Array<{ name: string; role: string; status: string }>
}
interface Command { id: string; type: CommandType; issueNumber?: number; state: string; createdAt: string }

definePageMeta({ layout: false })
useSeoMeta({ title: 'Tiny Courier Mission Control', robots: 'noindex, nofollow' })

const authState = ref<'checking' | 'loading' | 'authenticated' | 'guest'>('checking')
const password = ref('')
const loginError = ref('')
const snapshot = ref<Snapshot | null>(null)
const commands = ref<Command[]>([])
const apiError = ref('')
const commandBusy = ref(false)
const confirmation = ref<{ type: CommandType; issueNumber?: number; title: string; message: string } | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const onlineRunners = computed(() => snapshot.value?.runners.filter(r => r.status === 'online').length || 0)
const busyRunners = computed(() => snapshot.value?.runners.filter(r => r.busy).length || 0)
const readyCards = computed(() => snapshot.value?.cards.filter(c => c.labels.includes('ready')) || [])
const runningCards = computed(() => snapshot.value?.cards.filter(c => c.labels.includes('running')) || [])
const verificationCards = computed(() => snapshot.value?.cards.filter(c => c.labels.includes('verification')) || [])
const openPullRequests = computed(() => snapshot.value?.pullRequests.filter(pr => pr.state === 'OPEN') || [])
const greenPullRequests = computed(() => openPullRequests.value.filter(pr => pr.checks === 'success').length)
const ageSeconds = computed(() => snapshot.value ? (Date.now() - new Date(snapshot.value.generatedAt).getTime()) / 1000 : Infinity)
const freshnessClass = computed(() => ageSeconds.value < 120 ? 'fresh' : ageSeconds.value < 600 ? 'aging' : 'stale')
const freshnessLabel = computed(() => ageSeconds.value < 120 ? 'Live telemetry' : ageSeconds.value < 600 ? 'Telemetry delayed' : 'Telemetry stale')

async function checkSession() {
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/tiny-courier/auth/session')
    if (!session.authenticated) {
      authState.value = 'guest'
      return
    }
    authState.value = 'authenticated'
    await loadStatus()
  } catch {
    authState.value = 'guest'
  }
}

async function login() {
  authState.value = 'loading'
  loginError.value = ''
  try {
    await $fetch('/api/tiny-courier/auth/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    authState.value = 'authenticated'
    await loadStatus()
  } catch (error: any) {
    loginError.value = error?.data?.message || error?.statusMessage || 'Authentication failed'
    authState.value = 'guest'
  }
}

async function logout() {
  await $fetch('/api/tiny-courier/auth/logout', { method: 'POST' })
  if (refreshTimer) clearInterval(refreshTimer)
  authState.value = 'guest'
  snapshot.value = null
}

async function loadStatus() {
  try {
    const data = await $fetch<{ snapshot: Snapshot | null; commands: Command[] }>('/api/tiny-courier/status')
    snapshot.value = data.snapshot
    commands.value = data.commands
    apiError.value = data.snapshot ? '' : 'The VPS has not published its first status snapshot yet.'
  } catch (error: any) {
    if (error?.statusCode === 401) authState.value = 'guest'
    else apiError.value = error?.data?.message || 'Unable to load status.'
  }
}

function confirmCommand(type: CommandType, issueNumber?: number) {
  const copy: Record<CommandType, { title: string; message: string }> = {
    pause: { title: 'Pause development?', message: 'Stops future scheduled passes after the VPS processes this command. Any active pass is allowed to finish.' },
    resume: { title: 'Resume development?', message: 'Removes the stop file and allows future scheduled passes.' },
    run_now: { title: 'Run a development pass now?', message: 'Starts one bounded pass. It will still require an eligible low-risk ready card.' },
    promote_ready: { title: `Mark issue #${issueNumber} ready?`, message: 'Moves the card from backlog to the autonomous development queue.' },
    move_backlog: { title: `Move issue #${issueNumber} back?`, message: 'Removes the card from the autonomous development queue.' }
  }
  confirmation.value = { type, issueNumber, ...copy[type] }
}

async function sendConfirmedCommand() {
  if (!confirmation.value) return
  commandBusy.value = true
  apiError.value = ''
  try {
    await $fetch('/api/tiny-courier/commands', {
      method: 'POST',
      body: { type: confirmation.value.type, issueNumber: confirmation.value.issueNumber }
    })
    confirmation.value = null
    await loadStatus()
  } catch (error: any) {
    apiError.value = error?.data?.message || 'Command could not be queued.'
  } finally {
    commandBusy.value = false
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function commandLabel(type: CommandType) {
  return ({ pause: 'Pause automation', resume: 'Resume automation', run_now: 'Run development pass', promote_ready: 'Promote work card', move_backlog: 'Return card to backlog' })[type]
}

onMounted(async () => {
  await checkSession()
  refreshTimer = setInterval(() => {
    if (authState.value === 'authenticated') loadStatus()
  }, 15_000)
})
onBeforeUnmount(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@400;500;600;700&display=swap');

:global(body) { margin: 0; background: #08101f; }
:global(*) { box-sizing: border-box; }
:global(button), :global(input) { font: inherit; }

.mission-shell { min-height: 100vh; color: #e8eef9; background: radial-gradient(circle at 12% 0%, #142b55 0, transparent 32rem), radial-gradient(circle at 95% 12%, #473315 0, transparent 24rem), #08101f; font-family: 'Fira Sans', sans-serif; position: relative; overflow-x: hidden; }
.grid-noise { position: fixed; inset: 0; pointer-events: none; opacity: .11; background-image: linear-gradient(#8bb8ff 1px, transparent 1px), linear-gradient(90deg, #8bb8ff 1px, transparent 1px); background-size: 40px 40px; mask-image: linear-gradient(to bottom, #000, transparent 80%); }
.eyebrow { margin: 0 0 .35rem; color: #83a8e8; font: 600 .72rem/1.2 'Fira Code', monospace; letter-spacing: .14em; }
.login-stage { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; }
.login-card { width: min(100%, 430px); padding: 2rem; border: 1px solid #2c436a; border-radius: 24px; background: linear-gradient(145deg, rgba(19,35,64,.96), rgba(8,16,31,.98)); box-shadow: 0 30px 100px #0009, inset 0 1px #ffffff10; position: relative; }
.login-card h1 { font-size: clamp(2rem, 8vw, 3.4rem); line-height: .95; margin: .5rem 0 1rem; letter-spacing: -.055em; }
.login-copy { color: #a8b7d0; line-height: 1.55; margin-bottom: 1.75rem; }
.login-card label { display: block; color: #c4d3eb; font: 500 .76rem 'Fira Code', monospace; margin-bottom: .5rem; }
.login-card input { width: 100%; padding: .9rem 1rem; border: 1px solid #344e77; border-radius: 10px; background: #07101f; color: white; outline: none; }
.login-card input:focus { border-color: #6d9eff; box-shadow: 0 0 0 3px #4f83ed33; }
.primary-button { width: 100%; margin-top: 1rem; padding: .9rem 1rem; border: 0; border-radius: 10px; background: #f0a737; color: #111827; font-weight: 700; cursor: pointer; transition: .18s ease; }
.primary-button:hover:not(:disabled) { background: #ffc05b; transform: translateY(-1px); }
.primary-button:disabled { opacity: .55; cursor: wait; }
.form-error { color: #ff8b88; font-size: .85rem; }
.security-note { display: flex; align-items: center; gap: .55rem; margin-top: 1.3rem; color: #8293ad; font: .7rem 'Fira Code', monospace; }
.pulse-dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: #42d392; box-shadow: 0 0 0 4px #42d39220; }
.robot-mark { width: 70px; height: 70px; position: absolute; right: 1.5rem; top: -28px; border-radius: 18px; background: #f2ae49; box-shadow: 0 12px 30px #0007; display: grid; place-items: center; }
.robot-mark .face { width: 48px; height: 38px; background: #172641; border-radius: 13px; display: flex; align-items: center; justify-content: space-evenly; }
.robot-mark .face i, .mini-bot i { width: 7px; height: 7px; border-radius: 50%; background: #90dded; box-shadow: 0 0 8px #90dded; }
.antenna { position: absolute; width: 5px; height: 14px; top: -10px; background: #172641; border-radius: 5px; }
.topbar { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem clamp(1rem, 3vw, 3rem); border-bottom: 1px solid #22344f; background: #08101fdd; backdrop-filter: blur(18px); }
.brand-lockup { display: flex; align-items: center; gap: .9rem; }
.brand-lockup h1 { margin: 0; font-size: clamp(1.2rem, 3vw, 1.75rem); }
.mini-bot { width: 42px; height: 42px; border-radius: 11px; background: #f0a737; display: flex; align-items: center; justify-content: space-evenly; box-shadow: inset 0 0 0 8px #14233c; }
.topbar-actions { display: flex; align-items: center; gap: .7rem; }
.sync-state { display: inline-flex; align-items: center; gap: .55rem; padding: .5rem .7rem; border: 1px solid #2a405f; border-radius: 999px; color: #a9b7cc; font: .7rem 'Fira Code', monospace; }
.sync-state.aging .pulse-dot { background: #e6ae4c; }.sync-state.stale .pulse-dot { background: #e85c5c; }
.icon-button, .ghost-button { border: 1px solid #2c4364; background: #101c30; color: #c9d5e8; border-radius: 9px; cursor: pointer; }
.icon-button { width: 38px; height: 38px; padding: 8px; }.icon-button svg { fill: none; stroke: currentColor; stroke-width: 1.8; }
.ghost-button { padding: .58rem .85rem; }
.icon-button:hover, .ghost-button:hover { border-color: #577fba; color: white; }
.alert-banner { margin: 1rem clamp(1rem, 3vw, 3rem) 0; padding: .85rem 1rem; border: 1px solid #8b3f43; border-radius: 10px; background: #431e27; color: #ffc1c0; }
.status-ribbon { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #21344f; }
.status-ribbon article { min-width: 0; padding: 1.4rem clamp(1rem, 3vw, 2rem); border-right: 1px solid #21344f; background: #0b1526aa; }
.status-label { display: block; color: #8294af; font: .68rem 'Fira Code', monospace; text-transform: uppercase; letter-spacing: .1em; }
.status-ribbon strong { display: block; margin: .35rem 0 .15rem; font: 600 clamp(1.5rem, 4vw, 2.2rem) 'Fira Code', monospace; }
.status-ribbon small { color: #91a1b8; }.success-text { color: #52dda0; }.danger-text { color: #ff7974; }
.operator-strip { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.2rem clamp(1rem, 3vw, 3rem); background: linear-gradient(90deg, #172c52, #0d1b32); border-bottom: 1px solid #2b456d; }
.operator-strip h2 { margin: 0; font-size: 1.05rem; }.operator-actions { display: flex; flex-wrap: wrap; gap: .6rem; }
.action-button { border: 1px solid #3b5b8c; background: #17315b; color: #e8f0ff; padding: .65rem .9rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
.action-button:hover:not(:disabled) { background: #214477; }.action-button:disabled { opacity: .45; cursor: not-allowed; }
.danger-action { border-color: #8f484a; background: #53262b; }.success-action { border-color: #2f7d60; background: #164b3a; }
.dashboard-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1.25fr .75fr; gap: 1rem; padding: 1rem clamp(1rem, 3vw, 3rem) 2rem; max-width: 1800px; margin: auto; }
.panel { min-width: 0; border: 1px solid #223957; border-radius: 14px; background: linear-gradient(145deg, #0d192bbb, #091321ee); box-shadow: inset 0 1px #ffffff08; overflow: hidden; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.1rem; border-bottom: 1px solid #203650; }
.panel-heading h2 { margin: 0; font-size: 1.05rem; }.count-chip { color: #98aac3; background: #15243a; border: 1px solid #2d4668; border-radius: 999px; padding: .3rem .55rem; font: .67rem 'Fira Code', monospace; }
.card-list, .pr-list, .run-list, .command-list { padding: .5rem; }
.work-card { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem; border-radius: 9px; transition: .16s; }.work-card:hover { background: #15233a; }
.work-card-main { min-width: 0; }.issue-number, .pr-badge { color: #f0ae49; font: 600 .7rem 'Fira Code', monospace; }
.work-card a { display: block; color: #e8eef9; text-decoration: none; font-weight: 600; margin: .22rem 0 .4rem; }.work-card a:hover { color: #85b3ff; }
.label-row { display: flex; flex-wrap: wrap; gap: .35rem; }.label-chip { padding: .2rem .45rem; border-radius: 5px; background: #26364e; color: #aebbd0; font: .62rem 'Fira Code', monospace; }
.label-ready { background: #183f32; color: #70dfae; }.label-running { background: #493715; color: #f6c35f; }.label-verification { background: #193d62; color: #78bbf4; }.label-blocked, .label-risk-high { background: #4e242a; color: #ff9794; }
.card-actions button { white-space: nowrap; padding: .5rem .65rem; border-radius: 7px; border: 1px solid #3a5477; color: #c6d4e8; background: transparent; cursor: pointer; }
.pr-row, .run-row { display: flex; align-items: center; gap: .75rem; padding: .8rem; border-radius: 9px; text-decoration: none; color: #e6edf8; }.pr-row:hover, .run-row:hover { background: #14243a; }
.pr-copy, .run-row span:nth-child(2), .command-row span:nth-child(2) { min-width: 0; flex: 1; }.pr-copy strong, .run-row strong, .command-row strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.pr-copy small, .run-row small, .command-row small, .host-card small { display: block; color: #8193ad; margin-top: .2rem; }
.check-state, .run-row b, .command-row b { font: 600 .65rem 'Fira Code', monospace; text-transform: uppercase; }.check-good { color: #52dda0; }.check-warn { color: #f0b354; }
.host-panel, .command-panel { grid-column: span 1; }.host-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .65rem; padding: .8rem; }
.host-card { display: flex; align-items: center; gap: .65rem; padding: .75rem; background: #0c1727; border: 1px solid #1d304a; border-radius: 9px; }.host-icon { width: 34px; height: 34px; padding: 7px; border-radius: 8px; background: #182945; }.host-icon svg { fill: none; stroke: #8db8ff; stroke-width: 1.7; }
.host-status { margin-left: auto; font: .62rem 'Fira Code', monospace; }.status-online { color: #52dda0; }.status-offline { color: #ef7773; }
.run-light, .command-state { width: 8px; height: 8px; border-radius: 50%; flex: none; }.light-good, .command-completed { background: #4dde9c; box-shadow: 0 0 10px #4dde9c80; }.light-live, .command-running, .command-pending { background: #f0ac3e; }.light-bad, .command-failed { background: #f06262; }
.command-row { display: flex; align-items: center; gap: .7rem; padding: .72rem; }.command-row b { color: #9aabc1; }
.empty-state { color: #788aa3; text-align: center; padding: 1.5rem; font-size: .85rem; }
.mission-footer { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem clamp(1rem, 3vw, 3rem) 2rem; color: #61738e; font: .68rem 'Fira Code', monospace; }
.modal-backdrop { position: fixed; z-index: 10; inset: 0; display: grid; place-items: center; padding: 1rem; background: #020710cc; backdrop-filter: blur(8px); }
.confirm-modal { width: min(100%, 440px); border: 1px solid #38547c; border-radius: 16px; padding: 1.5rem; background: #0c1728; box-shadow: 0 30px 90px #000b; }.confirm-modal h2 { margin: .3rem 0 .7rem; }.confirm-modal p { color: #9eafc7; line-height: 1.55; }.modal-actions { display: flex; justify-content: flex-end; gap: .7rem; margin-top: 1.2rem; }.modal-actions .primary-button { width: auto; margin: 0; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #81adfa; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
@media (max-width: 900px) { .status-ribbon { grid-template-columns: repeat(2, 1fr); }.dashboard-grid { grid-template-columns: 1fr; }.host-grid { grid-template-columns: 1fr; }.topbar, .operator-strip { align-items: flex-start; flex-direction: column; }.topbar-actions { width: 100%; }.sync-state { margin-right: auto; } }
@media (max-width: 520px) { .status-ribbon { grid-template-columns: 1fr 1fr; }.status-ribbon article { padding: 1rem; }.status-ribbon strong { font-size: 1.35rem; }.work-card { align-items: flex-start; flex-direction: column; }.operator-actions { width: 100%; }.action-button { flex: 1; }.mission-footer { flex-direction: column; }.topbar-actions .ghost-button { padding-inline: .55rem; } }
</style>
