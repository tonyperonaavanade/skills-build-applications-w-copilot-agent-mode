import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid activity input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const { userId, teamId, type, minutes, occurredAt } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) throw invalidInput();

  const timestamp = occurredAt === undefined ? new Date() : new Date(occurredAt as string | number | Date);
  if (Number.isNaN(timestamp.getTime())) throw invalidInput();

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw Object.assign(new Error('Activity user or team not found'), { status: 404 });

  return Activity.create({ user: userId, team: teamId, type: type.trim(), minutes, points: minutes, occurredAt: timestamp });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid team input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && Types.ObjectId.isValid(member))
  ) throw invalidInput();

  const existingMembers = await User.countDocuments({ _id: { $in: members } });
  if (existingMembers !== members.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, activityTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(activityTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const focusByActivityType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
  };
  const activityFocuses = new Set(activities.map((activity) => focusByActivityType[activity.type.toLowerCase()]));
  const goal = user.fitnessGoal.toLowerCase();

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchesActivity = activityFocuses.has(focus);
      const reason = matchesGoal && matchesActivity
        ? `Matches your ${focus} goal and activity pattern.`
        : matchesGoal
          ? `Matches your ${focus} fitness goal.`
          : matchesActivity
            ? `Matches your recent ${focus} activity.`
            : `Suggested for your ${goal} goal.`;
      return { ...workout, reason, score: Number(matchesGoal) * 2 + Number(matchesActivity) };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
