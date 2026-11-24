import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw httpError('Invalid activity', 400);
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || type.trim().length === 0
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
    || !mongoose.isValidObjectId(userId)
    || !mongoose.isValidObjectId(teamId)
  ) {
    throw httpError('Invalid activity', 400);
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) {
    throw httpError('User or team not found', 404);
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const input = _input as { name?: unknown; mascot?: unknown; members?: unknown } | null;
  if (!input || typeof input !== 'object') {
    throw httpError('Invalid team', 400);
  }

  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || name.trim().length === 0 || typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw httpError('Team name and mascot are required', 400);
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw httpError('Invalid team members', 400);
  }

  const existingUsers = await User.find({ _id: { $in: members } }).select('_id').lean();
  if (existingUsers.length !== members.length) {
    throw httpError('Team member not found', 404);
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw httpError('User not found', 404);
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = recentActivity?.type?.toLowerCase();
  const focus = activityType === 'run'
    ? 'endurance'
    : activityType === 'strength'
      ? 'strength'
      : typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim().length > 0
        ? user.fitnessGoal
        : 'mobility';

  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: activityType
      ? `Matches your recent ${activityType} activity and ${focus} goal`
      : `Matches your ${focus} fitness goal`,
  }));
}

export { User };
