export interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: 'MEMBER' | 'ADMIN';
}

export interface Term {
  id: number;
  termName: string;
  startDate: string;
  endDate: string;
  monthlyContribution: number;
  status: 'ACTIVE' | 'CLOSED';
}

export interface Loan {
  id: number;
  memberId: number;
  memberName: string;
  termId: number;
  amount: number;
  interestRate: number;
  totalRepayable: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPAID' | 'DEFAULTED';
  requestedDate: string;
  dueDate: string;
}

export interface PoolSummary {
  termId: number;
  totalCollected: number;
  totalLent: number;
  available: number;
}

export interface PriorityQueueEntry {
  memberId: number;
  memberName: string;
  priorityScore: number;
  rank: number;
  eligibilityNote: string;
}

export interface Contribution {
  id: number;
  monthNumber: number;
  amount: number;
  paidDate: string;
  status: 'PAID' | 'LATE' | 'PENDING';
}

export interface ApiError {
  errorCode: string;
  message: string;
  timestamp: string;
}
