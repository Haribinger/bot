/**
 * AutonomousEngine — Background thinking loop for agents.
 *
 * Every agent runs this engine to continuously analyze context, identify
 * improvements, calculate efficiency, and propose automations. Thoughts are
 * stored in-memory and logged (no external API needed).
 *
 * Adapted from Harbinger's agents/shared/autonomous-engine.js.
 * Key change: stores thoughts locally instead of POSTing to swarm API.
 *
 * COST_BENEFIT = (TIME_SAVED * FREQUENCY) / (IMPL_COST + RUNNING_COST)
 * Only proposals with cost_benefit > 1.0 get surfaced.
 */

import { discoverAgents } from '../agents.js';

const MAX_THOUGHTS = 200; // Rolling buffer size

export class AutonomousEngine {
  constructor(opts = {}) {
    this.agentId = opts.agentId || 'unknown';
    this.agentName = opts.agentName || 'AGENT';
    this.agentType = opts.agentType || 'general';
    this.interval = opts.interval || 60000; // 60-second thinking cycle
    this._timer = null;
    this._running = false;
    this._cycleCount = 0;
    this._lastContext = null;
    this._thoughts = []; // in-memory thought storage
  }

  start() {
    if (this._running) return;
    this._running = true;
    console.log(`[${this.agentName}] Autonomous engine started (${this.interval / 1000}s cycle)`);

    // Run first cycle immediately, then on interval
    this._think();
    this._timer = setInterval(() => this._think(), this.interval);
  }

  stop() {
    this._running = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    console.log(`[${this.agentName}] Autonomous engine stopped after ${this._cycleCount} cycles`);
  }

  async _think() {
    this._cycleCount++;
    try {
      // 1. Gather context — what agents are available locally?
      const context = this._gatherContext();
      this._lastContext = context;

      // 2. Identify enhancements — scan 5 dimensions
      const enhancements = this._identifyEnhancements(context);

      // 3. For each enhancement, calculate efficiency and classify
      for (const enhancement of enhancements) {
        const efficiency = this._calculateEfficiency(enhancement);

        // Only store if cost-benefit ratio is positive
        if (efficiency.cost_benefit >= 1.0) {
          enhancement.efficiency = efficiency;
          enhancement.efficiency.automation_type = this._classifyAutomation(enhancement);
          this._storeThought(enhancement);
        }
      }
    } catch (err) {
      // Silent fail — don't crash the agent over thinking errors
      if (this._cycleCount <= 3) {
        console.error(`[${this.agentName}] Think cycle error:`, err.message);
      }
    }
  }

  /**
   * Gather local context — discover agents and their statuses.
   * No HTTP calls — everything is in-process.
   */
  _gatherContext() {
    try {
      const agents = discoverAgents();
      return {
        agents,
        agentCount: agents.length,
        self: agents.find(a => a.id === this.agentId) || null,
        thoughtCount: this._thoughts.length,
        cycleCount: this._cycleCount,
      };
    } catch {
      return { agents: [], agentCount: 0, self: null, thoughtCount: 0, cycleCount: this._cycleCount };
    }
  }

  // Scan 5 dimensions for potential enhancements
  _identifyEnhancements(context) {
    const enhancements = [];

    // Dimension 1: Performance — detect high thought volume
    if (context.thoughtCount > 50) {
      enhancements.push({
        type: 'enhancement',
        category: 'performance',
        title: `${this.agentName} generating high thought volume`,
        content: `Engine has ${context.thoughtCount} thoughts. Consider batch processing or reducing scan frequency.`,
        priority: 2,
      });
    }

    // Dimension 2: Accuracy — check cycle health
    if (context.cycleCount > 100 && context.thoughtCount === 0) {
      enhancements.push({
        type: 'observation',
        category: 'accuracy',
        title: 'No actionable thoughts after many cycles',
        content: `${context.cycleCount} cycles completed with no thoughts. Consider adjusting thresholds.`,
        priority: 3,
      });
    }

    // Dimension 3: Cost — monitor cycle count
    if (context.cycleCount > 1000) {
      enhancements.push({
        type: 'alert',
        category: 'cost',
        title: 'High cycle count — consider throttling',
        content: `Engine has run ${context.cycleCount} cycles. Consider increasing interval to reduce resource usage.`,
        priority: 4,
      });
    }

    // Dimension 4: Automation — detect idle potential
    if (context.agentCount > 0) {
      enhancements.push({
        type: 'proposal',
        category: 'automation',
        title: `${context.agentCount} agent profiles available`,
        content: `Agent profiles detected: ${context.agents.map(a => a.codename || a.id).join(', ')}. Could schedule proactive scans.`,
        priority: 2,
      });
    }

    // Dimension 5: Collaboration — multi-agent coordination
    if (context.agentCount > 3) {
      enhancements.push({
        type: 'proposal',
        category: 'collaboration',
        title: 'Multiple agents available — suggest coordinated workflow',
        content: `${context.agentCount} agent profiles loaded. Consider launching coordinated assessments.`,
        priority: 3,
      });
    }

    return enhancements;
  }

  // Calculate cost-benefit ratio for an enhancement
  _calculateEfficiency(enhancement) {
    const baseTimeSaved = { performance: 2, accuracy: 1, cost: 3, automation: 4, collaboration: 2 };
    const baseFrequency = { performance: 7, accuracy: 3, cost: 1, automation: 14, collaboration: 2 };
    const baseCost = { performance: 4, accuracy: 2, cost: 1, automation: 8, collaboration: 6 };

    const cat = enhancement.category || 'automation';
    const timeSaved = (baseTimeSaved[cat] || 1) * (enhancement.priority / 3);
    const frequency = baseFrequency[cat] || 1;
    const implCost = baseCost[cat] || 4;
    const runningCost = implCost * 0.1;

    const costBenefit = (timeSaved * frequency) / (implCost + runningCost);

    return {
      time_saved: Math.round(timeSaved * 100) / 100,
      frequency,
      implementation_cost: implCost,
      running_cost: Math.round(runningCost * 100) / 100,
      cost_benefit: Math.round(costBenefit * 100) / 100,
      automation_type: 'script',
    };
  }

  _classifyAutomation(enhancement) {
    const cat = enhancement.category;
    if (cat === 'automation') return 'script';
    if (cat === 'performance') return 'code_change';
    if (cat === 'collaboration') return 'workflow';
    if (cat === 'accuracy') return 'skill';
    return 'script';
  }

  /**
   * Store thought in the local rolling buffer.
   */
  _storeThought(thought) {
    const entry = {
      timestamp: new Date().toISOString(),
      agent_id: this.agentId,
      agent_name: this.agentName,
      type: thought.type || 'observation',
      category: thought.category || '',
      title: thought.title || 'Untitled thought',
      content: thought.content || '',
      priority: thought.priority || 3,
      efficiency: thought.efficiency || null,
    };

    this._thoughts.push(entry);

    // Rolling buffer — trim oldest
    if (this._thoughts.length > MAX_THOUGHTS) {
      this._thoughts = this._thoughts.slice(-MAX_THOUGHTS);
    }
  }

  /** Get all stored thoughts. */
  getThoughts() {
    return [...this._thoughts];
  }

  /** Get the last gathered context. */
  getLastContext() {
    return this._lastContext;
  }

  /** Get engine status. */
  getStatus() {
    return {
      running: this._running,
      cycles: this._cycleCount,
      agent: this.agentName,
      interval: this.interval,
      thoughtCount: this._thoughts.length,
    };
  }
}

let _engine = null;

/** Get the AutonomousEngine singleton. */
export function getAutonomousEngine() {
  return _engine;
}

/** Start the autonomous engine with the given options. */
export function startAutonomousEngine(opts = {}) {
  if (_engine) return _engine;
  _engine = new AutonomousEngine(opts);
  _engine.start();
  return _engine;
}

/** Stop the autonomous engine. */
export function stopAutonomousEngine() {
  if (_engine) {
    _engine.stop();
    _engine = null;
  }
}
