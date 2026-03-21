const en = {
  // Nav
  nav: {
    dashboard: "Dashboard",
    staff: "Staff",
    tasks: "Tasks",
    evaluations: "Evaluations",
    rewards: "Rewards",
    settings: "Settings",
    agent: "Agent",
  },
  // Environments
  env: {
    default: "Default",
    storeA: "Store A",
    storeB: "Store B",
    team1: "Team 1",
  },
  // Common
  common: {
    unassigned: "Unassigned",
    assign: "Assign",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    add: "Add",
    reset: "Reset",
    notSet: "Not set",
    human: "Human",
    agentAuto: "Agent Auto",
  },
  // Tasks
  tasks: {
    title: "Tasks",
    csvUpload: "CSV Upload",
    assignee: "Assignee",
    priority: "Priority",
    status: "Status",
    dueDate: "Due Date",
    evaluator: "Evaluator",
    achievements: "Achievements",
    newAchievement: "New achievement...",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    statusPending: "Not Started",
    statusInProgress: "In Progress",
    statusCompleted: "Completed",
  },
  // Evaluations
  evaluations: {
    title: "Evaluations",
    staff: "Staff",
    task: "Task",
    status: "Status",
    actions: "Actions",
    approve: "Approve",
    reject: "Reject",
    agentAuto: "Agent Auto",
    agentApprove: "Agent Approve",
    agentReject: "Agent Reject",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    agentApproved: "Agent Approved",
    agentRejected: "Agent Rejected",
    chatStaff: "Staff",
    chatAgent: "Agent",
    conversationEvaluation: "Conversation Evaluation",
    agentHistoryEvaluation: "Agent History Evaluation",
    good: "Good",
    bad: "Bad",
  },
  // Staff
  staffPage: {
    title: "Staff",
  },
  // Rewards
  rewards: {
    title: "Rewards",
    staff: "Staff",
    task: "Task",
    hours: "Hours",
    amount: "Amount",
    note: "Note",
    total: "Total",
    addReward: "Add Reward",
    noRewards: "No rewards yet",
  },
  // Agent
  agent: {
    title: "Agent",
    status: "Status",
    active: "Active",
    idle: "Idle",
    error: "Error",
    currentTask: "Current Task",
    lastActivity: "Last Activity",
    totalEvaluated: "Total Evaluated",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
    noTask: "No active task",
  },
};

export type Translations = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};

export default en;
