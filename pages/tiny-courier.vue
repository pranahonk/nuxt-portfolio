<template>
  <main class="mission-shell">
    <div class="room-grain" aria-hidden="true" />

    <!-- ── Gate ───────────────────────────────────────────────── -->
    <section v-if="authState !== 'authenticated'" class="gate">
      <div class="gate-card">
        <div class="gate-mark" aria-hidden="true">
          <span class="gate-dot" />
          <span class="gate-bars"><i /><i /><i /></span>
        </div>
        <p class="eyebrow">TINY COURIER · MISSION ROOM</p>
        <h1>Operator entry</h1>
        <p class="gate-copy">Live view of the development floor: crew, work cards, builds, and schedules. Read-only except the commands you confirm here.</p>
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
            {{ authState === 'loading' ? 'Opening the room…' : 'Enter the room' }}
          </button>
        </form>
        <p class="gate-note"><span class="pulse-dot" /> HttpOnly session · 8 hour expiry</p>
      </div>
    </section>

    <!-- ── Room ───────────────────────────────────────────────── -->
    <template v-else>
      <header class="hud">
        <div class="hud-brand">
          <span class="hud-mark" aria-hidden="true"><i /><i /></span>
          <div>
            <p class="eyebrow">TINY COURIER / MISSION ROOM</p>
            <h1>Development floor</h1>
          </div>
        </div>
        <div class="hud-actions">
          <span class="hud-sync" :class="freshnessClass"><span class="pulse-dot" />{{ freshnessLabel }}</span>
          <button class="icon-button" type="button" title="Refresh telemetry" aria-label="Refresh telemetry" @click="loadStatus">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
          </button>
          <button class="ghost-button" type="button" @click="logout">Sign out</button>
        </div>
      </header>

      <div v-if="apiError" class="alert-banner" role="alert"><strong>Telemetry interrupted.</strong> {{ apiError }}</div>

      <section class="stat-strip" aria-label="Mission statistics">
        <article>
          <span class="stat-label">Crew &amp; fleet</span>
          <strong>{{ onlineHosts }}/{{ snapshot?.hosts.length || 0 }}</strong>
          <small>{{ busyRunners ? `${busyRunners} executing a pass` : 'All positions standing by' }}</small>
        </article>
        <article>
          <span class="stat-label">Open tasks</span>
          <strong>{{ openTasks.length }}</strong>
          <small>{{ readyCount }} ready · {{ runningCount }} running · {{ reviewCount }} verifying</small>
        </article>
        <article>
          <span class="stat-label">Workspace</span>
          <strong>{{ snapshot?.ide?.agents.length || 0 }}</strong>
          <small>{{ snapshot?.ide?.relay === 'online' ? 'Relay online' : 'Relay offline' }} · {{ snapshot?.ide?.terminals.length || 0 }} terminals</small>
        </article>
        <article>
          <span class="stat-label">Schedules</span>
          <strong>{{ activeTimers }}/{{ snapshot?.timers?.length || 0 }}</strong>
          <small>{{ snapshot?.coordinator.paused ? 'Coordinator paused' : 'Coordinator armed' }}</small>
        </article>
      </section>

      <section class="stat-strip operator-strip">
        <article class="operator-copy">
          <span class="stat-label">Operator control</span>
          <strong>{{ snapshot?.coordinator.paused ? 'Loop paused' : 'Loop armed' }}</strong>
          <small>{{ snapshot?.coordinator.nextRun ? `Next pass ${formatTime(snapshot.coordinator.nextRun)}` : 'No scheduled pass' }}</small>
        </article>
        <div class="operator-buttons">
          <button v-if="snapshot?.coordinator.paused" class="action-button success-action" type="button" :disabled="commandBusy" @click="confirmCommand('resume')">Resume automation</button>
          <button v-else class="action-button danger-action" type="button" :disabled="commandBusy" @click="confirmCommand('pause')">Pause automation</button>
          <button class="action-button" type="button" :disabled="commandBusy || snapshot?.coordinator.paused" @click="confirmCommand('run_now')">Run a pass now</button>
        </div>
      </section>

      <div class="room-layout">
        <!-- ── Floor ─────────────────────────────────────────── -->
        <div class="room-main">
          <div class="room-toolbar">
            <div class="room-tabs" role="tablist" aria-label="Floor view">
              <button
                v-for="tab in tabs"
                :key="tab"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab"
              >{{ tab }}</button>
            </div>
            <div class="room-tabs" role="tablist" aria-label="Linked board" :hidden="noLinkedBoard">
              <button type="button" role="tab" :aria-selected="activeOverlay === 'tasks'" :class="{ active: activeOverlay === 'tasks' }" @click="activeOverlay = activeOverlay === 'tasks' ? null : 'tasks'">Tasks</button>
              <button type="button" role="tab" :aria-selected="activeOverlay === 'calendar'" :class="{ active: activeOverlay === 'calendar' }" @click="activeOverlay = activeOverlay === 'calendar' ? null : 'calendar'">Schedules</button>
            </div>
          </div>

          <div v-if="activeOverlay === 'tasks'" class="overlay-panel" role="region" aria-label="Task board">
            <div class="overlay-head">
              <h2>Task board</h2>
              <span class="count-chip">{{ openTasks.length }} open · {{ closedTasks.length }} closed</span>
            </div>
            <div class="board">
              <div v-for="group in taskGroups" :key="group.status" class="board-column">
                <p class="board-column-title">{{ group.label }} <span>{{ group.items.length }}</span></p>
                <div v-for="card in group.items" :key="card.number" class="board-card">
                  <a :href="card.url" target="_blank" rel="noreferrer" class="board-card-main">
                    <span class="board-card-number">#{{ card.number }}</span>
                    <span class="board-card-title">{{ card.title }}</span>
                  </a>
                  <span class="label-row">
                    <span v-for="label in card.labels" :key="label" class="label-chip" :class="`label-${label}`">{{ label }}</span>
                  </span>
                  <div v-if="canPromote(card) || canMoveBack(card)" class="board-card-actions">
                    <button v-if="canPromote(card)" type="button" class="card-action" :disabled="commandBusy" @click="confirmCommand('promote_ready', card.number)">Mark ready</button>
                    <button v-if="canMoveBack(card)" type="button" class="card-action ghost" :disabled="commandBusy" @click="confirmCommand('move_backlog', card.number)">Move to backlog</button>
                  </div>
                </div>
                <p v-if="!group.items.length" class="board-empty">None</p>
              </div>
            </div>
          </div>

          <div v-if="activeOverlay === 'calendar'" class="overlay-panel" role="region" aria-label="Schedules">
            <div class="overlay-head">
              <h2>Scheduled jobs</h2>
              <span class="count-chip">{{ snapshot?.timers?.length || 0 }} timers</span>
            </div>
            <div class="timer-list">
              <div v-for="timer in snapshot?.timers || []" :key="timer.unit" class="timer-row">
                <span class="run-light" :class="timer.state === 'active' ? 'light-good' : 'light-bad'" />
                <span>
                  <strong>{{ timer.unit.replace('.timer', '') }}</strong>
                  <small>next {{ timer.next ? formatTime(timer.next) : '—' }} · last {{ timer.last ? formatTime(timer.last) : '—' }}</small>
                </span>
                <b :class="timer.state === 'active' ? 'text-good' : 'text-bad'">{{ timer.state }}</b>
              </div>
              <p v-if="!snapshot?.timers?.length" class="empty-state">No scheduled jobs reported.</p>
            </div>
          </div>

          <!-- Workspace floor -->
          <div v-show="!activeOverlay || activeOverlay === null" class="pixel-room workspace">
            <div class="room-label"><span>{{ activeTab === 'Workspace' ? 'WORKSPACE' : activeTab.toUpperCase() }}</span><small>{{ floorSummary }}</small></div>
            <span class="pixel-window window-one" aria-hidden="true" />
            <span class="pixel-window window-two" aria-hidden="true" />
            <span class="pixel-door" aria-hidden="true" />

            <button
              v-for="(station, index) in floorStations"
              :key="station.id"
              type="button"
              class="pixel-station"
              :class="[`station-${(index % 5) + 1}`, `state-${station.state.toLowerCase()}`, { 'offline-station': station.state === 'Offline' }]"
              @click="openStation(station)"
            >
              <PixelCharacter :agent="station.id" />
              <span class="pixel-desk" :class="{ 'no-desk': station.state === 'Idle' }"><i /></span>
              <span class="pixel-station-name">{{ station.name }}</span>
              <span class="badge" :class="station.tone">{{ station.state }}</span>
              <span class="station-task">{{ station.task || station.room }}</span>
            </button>
            <p v-if="!floorStations.length" class="room-empty">No crew reported yet.</p>
          </div>

          <!-- OpenCode crew -->
          <div v-show="!activeOverlay || activeOverlay === null" class="crew-strip">
            <div class="room-label">
              <span>OPENCODE CREW</span>
              <small v-if="snapshot?.opencode?.runActive">{{ activeWorkers }} working · {{ waitingWorkers }} waiting · {{ stalledWorkers }} stalled · last log {{ logAgeLabel }} ago</small>
              <small v-else>No active run · {{ roleStations.length }} roles defined · last log {{ logAgeLabel }} ago</small>
            </div>
            <div class="crew-grid">
              <button
                v-for="role in roleStations"
                :key="role.id"
                type="button"
                class="crew-card"
                :class="`state-${role.state.toLowerCase()}`"
                @click="openStation(role)"
              >
                <PixelCharacter :agent="role.id" />
                <span class="crew-body">
                  <span class="crew-name">{{ role.name }}</span>
                  <span class="crew-role">{{ role.role }}</span>
                </span>
                <span class="badge" :class="role.tone">{{ role.state }}</span>
              </button>
              <p v-if="!roleStations.length" class="empty-state">No OpenCode run reported.</p>
            </div>
            <p v-if="snapshot?.opencode?.mcpDown?.length" class="crew-alert">
              {{ snapshot.opencode.mcpDown.length }} MCP server(s) unavailable: {{ snapshot.opencode.mcpDown.join(', ') }}
            </p>
          </div>
        </div>

        <!-- ── Side rail ─────────────────────────────────────── -->
        <aside class="room-side">
          <div class="side-card summary-card">
            <h2>Team snapshot</h2>
            <div class="summary-stat"><strong>{{ roleStations.length }}</strong><span>roles defined in the run</span></div>
            <hr>
            <div class="summary-stat"><strong>{{ activeWorkers }}</strong><span>working now</span></div>
            <hr>
            <div class="summary-stat"><strong>{{ waitingWorkers }}</strong><span>waiting on a permission</span></div>
            <hr>
            <div class="summary-stat"><strong :class="{ 'text-bad': stalledWorkers }">{{ stalledWorkers }}</strong><span>stalled (no log {{ logAgeLabel }})</span></div>
            <hr>
            <div class="summary-stat"><strong>{{ onlineHosts }}</strong><span>machines online</span></div>
          </div>

          <div class="side-card feed-card">
            <h2>Recent activity</h2>
            <article v-for="run in topRuns" :key="run.url">
              <a :href="run.url" target="_blank" rel="noreferrer">{{ run.name }}</a>
              <span :class="run.conclusion === 'success' ? 'text-good' : 'text-bad'">{{ run.conclusion || run.status }} · {{ formatTime(run.createdAt) }}</span>
            </article>
            <p v-if="!topRuns.length" class="empty-state">No recent pipeline runs.</p>
          </div>

          <div class="side-card terminals-card">
            <h2>Live terminals</h2>
            <div v-for="term in snapshot?.ide?.terminals || []" :key="term.name" class="terminal-row">
              <span class="run-light light-good" />
              <span><strong>{{ term.name }}</strong><small>{{ term.command }}</small></span>
            </div>
            <p v-if="!snapshot?.ide?.terminals.length" class="empty-state">No live sessions.</p>
            <a v-if="snapshot?.ide?.url" class="ide-open" :href="snapshot.ide.url" target="_blank" rel="noreferrer">
              Open relay
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
            <p class="ide-hint">Reachable over Tailscale only.</p>
          </div>

          <div v-if="snapshot?.system" class="side-card system-card">
            <h2>{{ snapshot.system.hostname }}</h2>
            <div class="gauge"><span>Load 1m</span><strong>{{ snapshot.system.load1.toFixed(2) }}</strong><i :style="{ width: bar(loadPct) }" :class="tone(loadPct)" /></div>
            <div class="gauge"><span>Memory</span><strong>{{ memPct }}%</strong><i :style="{ width: bar(memPct) }" :class="tone(memPct)" /></div>
            <div class="gauge"><span>Disk /</span><strong>{{ diskPct }}%</strong><i :style="{ width: bar(diskPct) }" :class="tone(diskPct)" /></div>
            <p class="system-foot">Uptime {{ formatUptime(snapshot.system.uptimeSeconds) }} · {{ snapshot.system.cpus }} vCPU · {{ formatBytes(snapshot.system.memUsed) }} used</p>
          </div>
        </aside>
      </div>

      <footer class="room-foot">
        <span>Schedules: weekdays 09:00–17:00 WIB · bounded hourly passes</span>
        <span>Never auto-merge · one low-risk card per pass · commands require confirmation</span>
      </footer>

      <!-- Station detail -->
      <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
        <section class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="station-title">
          <p class="eyebrow">{{ selected.room }}</p>
          <h2 id="station-title">{{ selected.name }}</h2>
          <dl class="detail-grid">
            <div><dt>State</dt><dd>{{ selected.state }}</dd></div>
            <div><dt>Role</dt><dd>{{ selected.role }}</dd></div>
            <div><dt>Current work</dt><dd>{{ selected.task || 'No active task attributable to this station' }}</dd></div>
            <div v-if="selected.detail"><dt>Last activity</dt><dd>{{ selected.detail }}</dd></div>
            <div><dt>Provenance</dt><dd>{{ selected.kind === 'role' ? 'OpenCode run log' : 'Managed placement' }}</dd></div>
          </dl>
          <div class="modal-actions">
            <button type="button" class="ghost-button" @click="selected = null">Close</button>
          </div>
        </section>
      </div>

      <!-- Confirm command -->
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
import { h } from 'vue'
import type { CSSProperties } from 'vue'

type CommandType = 'pause' | 'resume' | 'run_now' | 'promote_ready' | 'move_backlog'
type ServiceState = 'Idle' | 'Working' | 'Reviewing' | 'Collaborating' | 'Waiting' | 'Stalled' | 'Offline' | 'Unknown'
type StationKind = 'machine' | 'role'

interface Card { number: number; title: string; labels: string[]; url: string }
interface Snapshot {
  generatedAt: string
  coordinator: { paused: boolean; service: string; timer: string; nextRun: string | null; activeRun: string | null; lastResult: string }
  runners: Array<{ name: string; status: string; busy: boolean }>
  cards: Card[]
  pullRequests: Array<{ number: number; title: string; state: string; branch: string; url: string; checks: string }>
  recentRuns: Array<{ name: string; conclusion: string; status: string; url: string; createdAt: string }>
  hosts: Array<{ name: string; role: string; status: string }>
  ide?: {
    relay: string
    url: string | null
    agents: Array<{ name: string; status: string; version?: string | null }>
    terminals: Array<{ name: string; command: string; path?: string | null }>
  }
  system?: {
    hostname: string; uptimeSeconds: number; load1: number; load5: number; load15: number; cpus: number
    memTotal: number; memUsed: number; diskTotal: number; diskUsed: number
  }
  timers?: Array<{ unit: string; activates?: string | null; next?: string | null; last?: string | null; state: string }>
  opencode?: {
    runActive: boolean
    activeAgent: string | null
    lastEvent: string | null
    logAgeSeconds: number | null
    mcpDown: string[]
    agents: Array<{ name: string; state: string; mode?: string | null; model?: string | null; lastSeen?: string | null }>
  }
}
interface Command { id: string; type: CommandType; issueNumber?: number; state: string; createdAt: string }
interface Station { id: string; name: string; role: string; state: ServiceState; task: string | null; room: string; tone: string; kind: StationKind; detail: string | null }

definePageMeta({ layout: false })
useSeoMeta({ title: 'Tiny Courier Mission Room', robots: 'noindex, nofollow' })

const authState = ref<'checking' | 'loading' | 'authenticated' | 'guest'>('checking')
const password = ref('')
const loginError = ref('')
const snapshot = ref<Snapshot | null>(null)
const commands = ref<Command[]>([])
const apiError = ref('')
const commandBusy = ref(false)
const confirmation = ref<{ type: CommandType; issueNumber?: number; title: string; message: string } | null>(null)
const selected = ref<Station | null>(null)
const activeTab = ref<'Workspace' | 'Lounge'>('Workspace')
const activeOverlay = ref<'tasks' | 'calendar' | null>(null)
const tabs: Array<'Workspace' | 'Lounge'> = ['Workspace', 'Lounge']
let refreshTimer: ReturnType<typeof setInterval> | null = null

/* ── Pixel crew ─────────────────────────────────────────── */
const HAIR = ['#1d293c', '#b54b45', '#6a4d8d', '#3b2a20', '#c9a24a', '#2f4f3a', '#8b5a2b', '#11151c']
const SKIN = ['#e9b57d', '#c98e5a', '#f1c9a0', '#a8714a', '#dca06e']
const SHIRT = ['#e6b34e', '#70bdcb', '#93ca67', '#e76f51', '#8f7ae6', '#f4a3b4', '#4f9c7a', '#d9534f', '#5a8dee', '#c7a17a']
const PANTS = ['#36475d', '#374052', '#344349', '#4a3b2f', '#2f3a44', '#3d2f4a']

function hashName(name: string) {
  let hash = 2166136261
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const PixelCharacter = (props: { agent: string }) => {
  const hash = hashName(props.agent)
  const style = {
    '--hair': HAIR[hash % HAIR.length],
    '--skin': SKIN[(hash >>> 4) % SKIN.length],
    '--shirt': SHIRT[(hash >>> 8) % SHIRT.length],
    '--pants': PANTS[(hash >>> 12) % PANTS.length]
  } as CSSProperties
  return h('span', { class: 'pixel-character', style, 'aria-hidden': 'true' }, [
    h('span', { class: 'character-hair' }),
    h('span', { class: 'character-head' }, [h('i'), h('b')]),
    h('span', { class: 'character-torso' }),
    h('span', { class: 'character-arm left' }),
    h('span', { class: 'character-arm right' }),
    h('span', { class: 'character-leg left' }),
    h('span', { class: 'character-leg right' })
  ])
}

/* ── Derived data ───────────────────────────────────────── */
const onlineHosts = computed(() => snapshot.value?.hosts.filter((h) => h.status === 'online').length || 0)
const busyRunners = computed(() => snapshot.value?.runners.filter((r) => r.busy).length || 0)
const openTasks = computed(() => snapshot.value?.cards || [])
const closedTasks = computed(() => snapshot.value?.pullRequests.filter((pr) => pr.state !== 'OPEN') || [])
const readyCount = computed(() => openTasks.value.filter((c) => c.labels.includes('ready')).length)
const runningCount = computed(() => openTasks.value.filter((c) => c.labels.includes('running')).length)
const reviewCount = computed(() => snapshot.value?.cards.filter((c) => c.labels.includes('verification')).length || 0)
const activeTimers = computed(() => snapshot.value?.timers?.filter((t) => t.state === 'active').length || 0)
const topRuns = computed(() => (snapshot.value?.recentRuns || []).slice(0, 5))
const noLinkedBoard = computed(() => !openTasks.value.length && !(snapshot.value?.timers?.length))

// Mirrors the VPS promote_ready guard: only low-risk, non-human backlog cards qualify.
const canPromote = (card: Card) =>
  card.labels.includes('backlog') && card.labels.includes('risk-low') &&
  !card.labels.includes('risk-high') && !card.labels.includes('human-required')
const canMoveBack = (card: Card) => card.labels.includes('ready')

const ageSeconds = computed(() => (snapshot.value ? (Date.now() - new Date(snapshot.value.generatedAt).getTime()) / 1000 : Infinity))
const freshnessClass = computed(() => (ageSeconds.value < 120 ? 'fresh' : ageSeconds.value < 600 ? 'aging' : 'stale'))
const freshnessLabel = computed(() => (ageSeconds.value < 120 ? 'Live telemetry' : ageSeconds.value < 600 ? 'Telemetry delayed' : 'Telemetry stale'))

const memPct = computed(() => (snapshot.value?.system && snapshot.value.system.memTotal > 0 ? Math.round((snapshot.value.system.memUsed / snapshot.value.system.memTotal) * 100) : 0))
const diskPct = computed(() => (snapshot.value?.system && snapshot.value.system.diskTotal > 0 ? Math.round((snapshot.value.system.diskUsed / snapshot.value.system.diskTotal) * 100) : 0))
const loadPct = computed(() => (snapshot.value?.system && snapshot.value.system.cpus > 0 ? Math.round((snapshot.value.system.load1 / snapshot.value.system.cpus) * 100) : 0))

/** Machine hosts on the floor; each carries a real state. */
const floorStations = computed<Station[]>(() => {
  const snap = snapshot.value
  if (!snap) return []
  const stations: Station[] = []
  snap.hosts.forEach((host) => {
    const running = host.status === 'online' && (snap.coordinator.activeRun === 'active' || busyRunners.value > 0)
    const state: ServiceState = host.status !== 'online' ? 'Offline' : host.role === 'Coordinator' && running ? 'Working' : 'Idle'
    stations.push({ id: host.name, name: host.name, role: host.role, state, task: null, room: 'Workspace', tone: toneForState(state), kind: 'machine', detail: null })
  })
  return stations
})

/** OpenCode role agents observed in the live run — the real crew. */
const roleStations = computed<Station[]>(() => {
  const oc = snapshot.value?.opencode
  if (!oc?.agents?.length) return []
  return oc.agents.map((agent) => {
    const state = agent.state as ServiceState
    return {
      id: `role-${agent.name}`,
      name: agent.name,
      role: agent.mode === 'primary' ? 'Primary orchestrator' : 'Role agent',
      state,
      task: agent.model ? agent.model : null,
      room: 'Workspace',
      tone: toneForState(state),
      kind: 'role' as const,
      detail: agent.lastSeen ? `Last seen ${formatTime(agent.lastSeen)}` : 'No activity in this run'
    }
  })
})

const activeWorkers = computed(() => roleStations.value.filter((s) => s.state === 'Working').length)
const idleWorkers = computed(() => roleStations.value.filter((s) => s.state === 'Idle').length)
const waitingWorkers = computed(() => roleStations.value.filter((s) => s.state === 'Waiting').length)
const stalledWorkers = computed(() => roleStations.value.filter((s) => s.state === 'Stalled').length)
const logAgeLabel = computed(() => {
  const age = snapshot.value?.opencode?.logAgeSeconds
  return age === null || age === undefined ? 'no log' : formatUptime(age)
})
const floorSummary = computed(() => `${activeWorkers.value} working · ${idleWorkers.value} idle · ${onlineHosts.value} machines online`)

const taskGroups = computed(() => {
  const cards = openTasks.value
  return [
    { status: 'ready', label: 'Ready', items: cards.filter((c) => c.labels.includes('ready')) },
    { status: 'backlog', label: 'Backlog', items: cards.filter((c) => c.labels.includes('backlog')) },
    { status: 'verification', label: 'Verification', items: cards.filter((c) => c.labels.includes('verification')) },
    { status: 'unlabelled', label: 'Reports & other', items: cards.filter((c) => !c.labels.some((l) => ['ready', 'backlog', 'verification'].includes(l))) }
  ]
})

function toneForState(state: ServiceState) {
  if (state === 'Offline') return 'muted'
  if (state === 'Stalled') return 'bad'
  if (state === 'Waiting') return 'warn'
  if (state === 'Idle' || state === 'Unknown') return 'unknown'
  return 'good'
}
function tone(value: number) {
  return value > 85 ? 'bar-bad' : value > 60 ? 'bar-warn' : 'bar-good'
}
function bar(value: number) {
  return `${Math.min(Math.max(value, 0), 100)}%`
}
function formatBytes(value: number) {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const hrs = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${hrs}h`
  if (hrs > 0) return `${hrs}h ${m}m`
  return `${m}m`
}
function formatTime(value: string) {
  return formatJakartaTime(value)
}
function openStation(station: Station) {
  selected.value = station
}

/* ── Backend ────────────────────────────────────────────── */
async function checkSession() {
  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/tiny-courier/auth/session')
    if (!session.authenticated) { authState.value = 'guest'; return }
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

onMounted(async () => {
  await checkSession()
  refreshTimer = setInterval(() => {
    if (authState.value === 'authenticated') loadStatus()
  }, 15_000)
})
onBeforeUnmount(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

:global(body) { margin: 0; background: #0b0e0c; }
:global(*) { box-sizing: border-box; }
:global(button), :global(input) { font: inherit; }

.mission-shell {
  --bg: #0b0e0c; --surface: #151d1b; --surface-2: #101815; --line: #354440; --line-soft: #263129;
  --text: #eef3ec; --text-dim: #94a69d; --text-faint: #778078;
  --accent: #79d6bd; --accent-strong: #bcffe0; --good: #74c59a; --warn: #eab474; --bad: #ff9d8f;
  min-height: 100vh; color: var(--text); background: var(--bg);
  font-family: 'Fira Sans', ui-sans-serif, system-ui, sans-serif; position: relative;
}
.room-grain { position: fixed; inset: 0; pointer-events: none; opacity: .5; background-image: radial-gradient(circle at 20% 0, #1e3a30 0, transparent 42%), radial-gradient(circle at 90% 8%, #14262e 0, transparent 30%); }
.eyebrow { margin: 0 0 .35rem; color: var(--accent); font: 600 .68rem/1.2 'Fira Code', monospace; letter-spacing: .16em; }

/* Gate */
.gate { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; }
.gate-card { width: min(100%, 420px); padding: 2rem; border: 1px solid var(--line); background: var(--surface-2); position: relative; }
.gate-card h1 { font-size: clamp(1.9rem, 7vw, 2.8rem); line-height: 1; margin: .4rem 0 1rem; letter-spacing: -.04em; }
.gate-copy { color: var(--text-dim); line-height: 1.5; margin-bottom: 1.6rem; font-size: .92rem; }
.gate-card label { display: block; color: var(--text-dim); font: 500 .72rem 'Fira Code', monospace; margin-bottom: .5rem; }
.gate-card input { width: 100%; padding: .85rem 1rem; border: 1px solid var(--line); background: #0d1311; color: var(--text); outline: none; }
.gate-card input:focus { border-color: var(--accent); }
.gate-note { display: flex; align-items: center; gap: .5rem; margin-top: 1.2rem; color: var(--text-faint); font: .68rem 'Fira Code', monospace; }
.gate-mark { position: absolute; right: 1.6rem; top: 1.6rem; display: grid; gap: .3rem; }
.gate-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.gate-bars { display: flex; gap: 3px; }
.gate-bars i { width: 4px; height: 14px; background: var(--line); }

.primary-button { width: 100%; margin-top: 1rem; padding: .85rem 1rem; border: 1px solid var(--accent); background: var(--accent); color: #0d1311; font-weight: 600; cursor: pointer; transition: .16s ease; }
.primary-button:hover:not(:disabled) { background: var(--accent-strong); }
.primary-button:disabled { opacity: .55; cursor: wait; }
.form-error { color: var(--bad); font-size: .82rem; }
.pulse-dot { width: 8px; height: 8px; flex: none; border-radius: 50%; background: var(--good); box-shadow: 0 0 0 4px rgb(116 197 154 / .12); }

/* HUD */
.hud { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem clamp(1rem, 3vw, 2.2rem); border-bottom: 1px solid var(--line); background: var(--surface-2); }
.hud-brand { display: flex; align-items: center; gap: .85rem; }
.hud-brand h1 { margin: 0; font-size: clamp(1.1rem, 2.6vw, 1.5rem); letter-spacing: -.02em; }
.hud-mark { width: 40px; height: 40px; border: 1px solid var(--line); display: grid; place-items: center; gap: 4px; grid-auto-flow: column; background: #0d1311; }
.hud-mark i { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.hud-actions { display: flex; align-items: center; gap: .6rem; }
.hud-sync { display: inline-flex; align-items: center; gap: .5rem; padding: .45rem .7rem; border: 1px solid var(--line); color: var(--text-dim); font: .68rem 'Fira Code', monospace; }
.hud-sync.aging .pulse-dot { background: var(--warn); }
.hud-sync.stale .pulse-dot { background: var(--bad); }
.icon-button, .ghost-button { border: 1px solid var(--line); background: var(--surface); color: var(--text); cursor: pointer; transition: .16s; }
.icon-button { width: 38px; height: 38px; padding: 8px; }
.icon-button svg { fill: none; stroke: currentColor; stroke-width: 1.8; }
.ghost-button { padding: .55rem .8rem; font-size: .85rem; }
.icon-button:hover, .ghost-button:hover { border-color: var(--accent); color: var(--accent-strong); }
.alert-banner { margin: 1rem clamp(1rem, 3vw, 2.2rem) 0; padding: .8rem 1rem; border: 1px solid var(--bad); background: #2a1313; color: var(--bad); }

/* Stat strips */
.stat-strip { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--line); }
.stat-strip article { min-width: 0; padding: 1.2rem clamp(1rem, 3vw, 2.2rem); border-right: 1px solid var(--line-soft); }
.stat-strip article:last-child { border-right: 0; }
.stat-label { display: block; color: var(--text-faint); font: .64rem 'Fira Code', monospace; text-transform: uppercase; letter-spacing: .12em; }
.stat-strip strong { display: block; margin: .35rem 0 .15rem; font: 600 clamp(1.4rem, 3.5vw, 2rem) 'Fira Code', monospace; color: var(--accent-strong); }
.stat-strip small { color: var(--text-dim); font-size: .76rem; line-height: 1.4; }
.operator-strip { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
.operator-copy strong { color: var(--text); }
.operator-buttons { display: flex; gap: .6rem; padding: 1rem clamp(1rem, 3vw, 2.2rem); }
.action-button { border: 1px solid var(--line); background: var(--surface); color: var(--text); padding: .6rem .9rem; cursor: pointer; font-weight: 600; font-size: .85rem; transition: .16s; }
.action-button:hover:not(:disabled) { border-color: var(--accent); }
.action-button:disabled { opacity: .45; cursor: not-allowed; }
.danger-action { border-color: #6b3a38; color: var(--bad); }
.success-action { border-color: #2f6b52; color: var(--good); }

/* Room layout */
.room-layout { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 1rem; padding: 1rem clamp(1rem, 3vw, 2.2rem) 1.5rem; max-width: 1900px; margin: auto; }
.room-main { min-width: 0; }
.room-toolbar { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: space-between; margin-bottom: .75rem; }
.room-tabs { display: flex; gap: 6px; }
.room-tabs button { border: 1px solid var(--line); background: var(--surface); color: var(--text-dim); cursor: pointer; font: .68rem 'Fira Code', monospace; letter-spacing: .1em; padding: .55rem .9rem; text-transform: uppercase; }
.room-tabs button.active { background: #123a32; border-color: var(--accent); color: var(--accent-strong); }

/* Overlay panels */
.overlay-panel { border: 1px solid var(--line); background: var(--surface); margin-bottom: .75rem; padding: 1rem; }
.overlay-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .85rem; }
.overlay-head h2 { margin: 0; font-size: 1rem; }
.count-chip { color: var(--text-dim); border: 1px solid var(--line); padding: .25rem .55rem; font: .64rem 'Fira Code', monospace; }
.board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
.board-column { min-width: 0; }
.board-column-title { margin: 0 0 .5rem; color: var(--text-dim); font: .66rem 'Fira Code', monospace; text-transform: uppercase; letter-spacing: .1em; }
.board-column-title span { color: var(--text-faint); }
.board-card { display: block; border: 1px solid var(--line-soft); background: #0d1311; padding: .6rem; margin-bottom: .5rem; text-decoration: none; color: var(--text); transition: .16s; }
.board-card:hover { border-color: var(--accent); }
.board-card-main { display: block; text-decoration: none; color: inherit; }
.board-card-number { color: var(--warn); font: .66rem 'Fira Code', monospace; }
.board-card-title { display: block; font-size: .82rem; margin: .2rem 0 .4rem; line-height: 1.35; }
.board-card-actions { display: flex; gap: .35rem; margin-top: .5rem; }
.card-action { border: 1px solid var(--line); background: var(--surface-2); color: var(--accent); padding: .3rem .55rem; cursor: pointer; font: 600 .66rem 'Fira Code', monospace; transition: .16s; }
.card-action:hover:not(:disabled) { border-color: var(--accent); color: var(--accent-strong); }
.card-action:disabled { opacity: .45; cursor: not-allowed; }
.card-action.ghost { color: var(--text-dim); }
.card-action.ghost:hover:not(:disabled) { color: var(--text); }
.board-empty { color: var(--text-faint); font-size: .75rem; }
.label-row { display: flex; flex-wrap: wrap; gap: .3rem; }
.label-chip { padding: .15rem .4rem; background: var(--line-soft); color: var(--text-dim); font: .58rem 'Fira Code', monospace; }
.label-ready { background: #14352a; color: var(--good); }
.label-running { background: #3a2f14; color: var(--warn); }
.label-verification { background: #16344a; color: #78bbf4; }
.label-backlog { background: var(--line-soft); }

.timer-list { display: grid; gap: .4rem; }
.timer-row { display: flex; align-items: center; gap: .7rem; padding: .55rem .6rem; border: 1px solid var(--line-soft); }
.timer-row span:nth-child(2) { min-width: 0; flex: 1; }
.timer-row strong { display: block; font-size: .85rem; }
.timer-row small { display: block; color: var(--text-faint); margin-top: .15rem; font: .66rem 'Fira Code', monospace; }
.timer-row b { font: 600 .64rem 'Fira Code', monospace; text-transform: uppercase; }
.run-light { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.light-good { background: var(--good); box-shadow: 0 0 8px rgb(116 197 154 / .5); }
.light-bad { background: var(--bad); }

/* Pixel room */
.pixel-room {
  aspect-ratio: 1.55 / 1; min-height: 420px; position: relative; overflow: hidden;
  border: 8px solid #121a18;
  background-color: #22312c;
  background-image:
    linear-gradient(90deg, rgb(255 255 255 / .035) 1px, transparent 1px),
    linear-gradient(rgb(255 255 255 / .035) 1px, transparent 1px),
    linear-gradient(135deg, #2b3d35 0 19%, #1a2823 19% 20%, #27382f 20% 100%);
  background-size: 14px 14px, 14px 14px, auto;
  box-shadow: inset 0 0 0 2px #4d6459, inset 0 0 0 7px #1a2521;
}
.pixel-room::after { content: ''; position: absolute; inset: auto 0 0 0; height: 37%; background: repeating-linear-gradient(90deg, transparent 0 48px, rgb(0 0 0 / .1) 48px 50px); pointer-events: none; }
.room-label { position: absolute; left: 12px; right: 12px; top: 12px; z-index: 3; display: flex; justify-content: space-between; padding: 8px 10px; background: #101815; border-bottom: 2px solid #527065; }
.room-label span { color: #b6ffdd; font: .72rem 'Fira Code', monospace; letter-spacing: .12em; text-transform: uppercase; }
.room-label small { color: var(--text-faint); font: .64rem 'Fira Code', monospace; }
.pixel-window { position: absolute; top: 17%; height: 20%; width: 14%; border: 5px solid #17201e; background: linear-gradient(#78d6d4 0 17%, #4e9398 17% 20%, #1b5869 20% 100%); box-shadow: inset 0 0 0 2px #81b7ad; }
.window-one { left: 9%; } .window-two { right: 9%; }
.pixel-door { position: absolute; bottom: 32%; left: 45%; width: 10%; height: 28%; background: #845b3e; border: 5px solid #17201e; }
.pixel-door::after { content: ''; position: absolute; right: 10%; top: 54%; width: 5px; height: 5px; background: #f2bd69; }
.room-empty { position: absolute; left: 32%; bottom: 13%; color: #d4dfd7; font: .72rem 'Fira Code', monospace; z-index: 2; }

/* OpenCode crew strip sits under the machine floor. */
.crew-strip { border: 1px solid var(--line-soft); background: var(--surface-2); padding: .8rem .9rem 1rem; margin-top: .9rem; }
.crew-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: .5rem; margin-top: .6rem; }
.crew-card { display: flex; align-items: center; gap: .6rem; padding: .5rem .6rem; border: 1px solid var(--line-soft); background: #0d1311; color: var(--text); cursor: pointer; text-align: left; transition: .16s; }
.crew-card:hover { border-color: var(--accent); }
.crew-card .pixel-character { transform: scale(.72); transform-origin: left center; flex: none; }
.crew-body { display: grid; gap: .1rem; min-width: 0; flex: 1; }
.crew-name { font: .74rem 'Fira Code', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.crew-role { color: var(--text-faint); font: .6rem 'Fira Code', monospace; }
.crew-card.state-working { border-color: #1e5c46; }
.crew-card.state-waiting { border-color: #6a4f1c; }
.crew-card.state-stalled { border-color: #6e2f28; background: #160f0d; }
.crew-alert { margin: .6rem 0 0; color: var(--warn); font: .64rem 'Fira Code', monospace; line-height: 1.4; }

.pixel-station { position: absolute; z-index: 6; display: grid; gap: 4px; justify-items: center; min-height: 116px; width: 138px; padding: 0; border: 0; background: transparent; color: var(--text); cursor: pointer; text-align: center; }
.pixel-station:hover .pixel-station-name { color: var(--accent-strong); }
.station-1 { left: 18%; bottom: 24%; }
.station-2 { right: 16%; bottom: 20%; }
.station-3 { left: 36%; bottom: 8%; }
.station-4 { right: 34%; bottom: 38%; }
.station-5 { left: 6%; bottom: 12%; }
.pixel-desk { display: block; position: relative; width: 81px; height: 31px; margin: 0 auto; background: #79533d; border: 4px solid #17201e; }
.pixel-desk i { position: absolute; top: -26px; left: 26px; width: 31px; height: 24px; background: #69d4c0; border: 3px solid #17201e; }
.pixel-desk i::after { content: ''; position: absolute; bottom: -7px; left: 11px; width: 6px; height: 7px; background: #17201e; }
.pixel-desk.no-desk { opacity: .35; }
.pixel-station-name { background: #101815; padding: 2px 5px; font: .66rem 'Fira Code', monospace; line-height: 1.35; }
.station-task { color: var(--text-faint); font: .58rem 'Fira Code', monospace; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.offline-station { filter: grayscale(1) brightness(.55); }
.badge { padding: 2px 6px; font: .58rem 'Fira Code', monospace; text-transform: uppercase; letter-spacing: .06em; }
.badge.good { background: #14352a; color: var(--good); }
.badge.unknown { background: var(--line-soft); color: var(--text-dim); }
.badge.muted { background: #2a1313; color: var(--bad); }
.badge.bad { background: #2a1313; color: var(--bad); }
.badge.warn { background: #33280f; color: var(--warn); }

/* Pixel character */
.pixel-character { --hair: #24394b; --skin: #e9b57d; --shirt: #6bd4c0; --pants: #263b55; position: relative; display: inline-block; width: 52px; height: 58px; z-index: 2; }
.character-head, .character-hair, .character-torso, .character-arm, .character-leg { position: absolute; image-rendering: pixelated; }
.character-head { left: 15px; top: 9px; width: 22px; height: 20px; background: var(--skin); box-shadow: inset 4px 0 #d79666; }
.character-head i, .character-head b { position: absolute; top: 9px; display: block; width: 3px; height: 3px; background: #17201e; }
.character-head i { left: 5px; } .character-head b { right: 5px; }
.character-hair { left: 12px; top: 5px; width: 5px; height: 5px; background: var(--hair); box-shadow: 4px 4px var(--hair), 8px 0 var(--hair), 12px 0 var(--hair), 16px 0 var(--hair), 20px 4px var(--hair), 24px 8px var(--hair); }
.character-torso { left: 13px; top: 29px; width: 26px; height: 18px; background: var(--shirt); box-shadow: inset 4px 0 rgb(0 0 0 / .16); }
.character-arm { top: 31px; width: 6px; height: 15px; background: var(--skin); }
.character-arm.left { left: 7px; } .character-arm.right { right: 7px; }
.character-leg { bottom: 0; width: 9px; height: 13px; background: var(--pants); }
.character-leg.left { left: 16px; } .character-leg.right { right: 16px; }

.state-working .character-arm { animation: mc-type .5s steps(2) infinite; }
.state-working .character-arm.right { animation-delay: .25s; }
.state-reviewing .character-head { animation: mc-nod 1.8s steps(2) infinite; }
.state-collaborating .pixel-character { animation: mc-bob 1s steps(2) infinite; }
.state-idle .pixel-character { animation: mc-breathe 3.2s ease-in-out infinite; }
@keyframes mc-type { 50% { transform: translateY(2px); } }
@keyframes mc-nod { 50% { transform: translateY(2px); } }
@keyframes mc-bob { 50% { transform: translateY(-2px); } }
@keyframes mc-breathe { 50% { opacity: .8; } }

/* Side rail */
.room-side { display: grid; gap: .75rem; align-content: start; min-width: 0; }
.side-card { border: 1px solid var(--line); background: var(--surface); padding: .9rem; }
.side-card h2 { margin: 0 0 .75rem; font-size: .92rem; }
.summary-card { display: grid; gap: .5rem; }
.summary-stat { display: flex; align-items: baseline; gap: .5rem; }
.summary-stat strong { font: 600 1.5rem 'Fira Code', monospace; color: var(--accent-strong); }
.summary-stat span { color: var(--text-dim); font: .66rem 'Fira Code', monospace; line-height: 1.3; }
.summary-card hr { width: 100%; border: 0; border-top: 1px solid var(--line-soft); margin: .2rem 0; }
.feed-card article { display: grid; gap: .2rem; padding: .5rem 0; border-top: 1px solid var(--line-soft); }
.feed-card article:first-of-type { border-top: 0; }
.feed-card a { color: var(--text); text-decoration: none; font-size: .82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feed-card a:hover { color: var(--accent); }
.feed-card span { color: var(--text-faint); font: .6rem 'Fira Code', monospace; text-transform: uppercase; }
.terminals-card .terminal-row { display: flex; align-items: center; gap: .55rem; padding: .45rem 0; border-top: 1px solid var(--line-soft); }
.terminals-card .terminal-row:first-of-type { border-top: 0; }
.terminals-card .terminal-row strong { display: block; font-size: .8rem; }
.terminals-card .terminal-row small { color: var(--text-faint); font: .62rem 'Fira Code', monospace; }
.ide-open { display: inline-flex; align-items: center; gap: .35rem; margin-top: .6rem; padding: .5rem .7rem; border: 1px solid var(--accent); color: var(--accent-strong); text-decoration: none; font-size: .8rem; font-weight: 600; }
.ide-open:hover { background: #123a32; }
.ide-open svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; }
.ide-hint { margin: .5rem 0 0; color: var(--text-faint); font: .6rem 'Fira Code', monospace; }
.system-card .gauge { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .2rem .5rem; margin-bottom: .55rem; }
.system-card .gauge span { color: var(--text-dim); font: .64rem 'Fira Code', monospace; text-transform: uppercase; }
.system-card .gauge strong { font: 600 .85rem 'Fira Code', monospace; }
.system-card .gauge i { grid-column: 1 / -1; display: block; height: 5px; background: var(--line-soft); }
.system-card .gauge i.bar-good { background: var(--good); }
.system-card .gauge i.bar-warn { background: var(--warn); }
.system-card .gauge i.bar-bad { background: var(--bad); }
.system-foot { margin: .4rem 0 0; color: var(--text-faint); font: .62rem 'Fira Code', monospace; line-height: 1.4; }

.room-foot { display: flex; justify-content: space-between; gap: 1rem; padding: 0 clamp(1rem, 3vw, 2.2rem) 2rem; color: var(--text-faint); font: .66rem 'Fira Code', monospace; }
.empty-state { color: var(--text-faint); font-size: .78rem; padding: .5rem 0; }
.text-good { color: var(--good); } .text-bad { color: var(--bad); }

/* Modals */
.modal-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgb(6 9 7 / .78); backdrop-filter: blur(6px); }
.detail-modal, .confirm-modal { width: min(100%, 460px); border: 1px solid var(--accent); background: var(--surface); padding: 1.4rem; box-shadow: 0 24px 70px #000a; }
.detail-modal h2, .confirm-modal h2 { margin: .3rem 0 .8rem; }
.detail-modal p, .confirm-modal p { color: var(--text-dim); line-height: 1.5; font-size: .88rem; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 0; }
.detail-grid dt { color: var(--text-faint); font: .62rem 'Fira Code', monospace; text-transform: uppercase; margin-bottom: .25rem; }
.detail-grid dd { margin: 0; font-size: .85rem; line-height: 1.4; }
.modal-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1.2rem; }
.modal-actions .primary-button { width: auto; margin: 0; }

button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
@media (max-width: 1100px) { .room-layout { grid-template-columns: 1fr; } .room-side { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 900px) {
  .stat-strip { grid-template-columns: repeat(2, 1fr); }
  .board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .operator-strip { grid-template-columns: 1fr; }
  .hud { flex-wrap: wrap; }
}
@media (max-width: 700px) {
  .room-side { grid-template-columns: 1fr; }
  .pixel-room { aspect-ratio: .95 / 1; min-height: 470px; }
  .station-1 { left: 16%; } .station-2 { right: 4%; } .station-3 { left: 2%; }
  .board { grid-template-columns: 1fr; }
  .room-foot { flex-direction: column; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
