migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const own = '@request.auth.id != "" && user = @request.auth.id'

    const exercises = new Collection({
      type: 'base',
      name: 'exercises',
      listRule: own,
      viewRule: own,
      createRule: own,
      updateRule: own,
      deleteRule: own,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: users.id,
        },
        { type: 'text', name: 'name', required: true, max: 120 },
        { type: 'text', name: 'muscle', max: 60 },
      ],
      indexes: ['CREATE INDEX `idx_exercises_user` ON `exercises` (`user`)'],
    })
    app.save(exercises)

    const workouts = new Collection({
      type: 'base',
      name: 'workouts',
      listRule: own,
      viewRule: own,
      createRule: own,
      updateRule: own,
      deleteRule: own,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: users.id,
        },
        { type: 'date', name: 'date', required: true },
        { type: 'text', name: 'note', max: 200 },
      ],
      indexes: ['CREATE INDEX `idx_workouts_user_date` ON `workouts` (`user`, `date`)'],
    })
    app.save(workouts)

    const sets = new Collection({
      type: 'base',
      name: 'sets',
      listRule: own,
      viewRule: own,
      createRule: own,
      updateRule: own,
      deleteRule: own,
      fields: [
        {
          type: 'relation',
          name: 'user',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: users.id,
        },
        {
          type: 'relation',
          name: 'workout',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: workouts.id,
        },
        {
          type: 'relation',
          name: 'exercise',
          required: true,
          cascadeDelete: false,
          maxSelect: 1,
          collectionId: exercises.id,
        },
        { type: 'number', name: 'set_number' },
        { type: 'number', name: 'weight' },
        { type: 'number', name: 'reps' },
      ],
      indexes: [
        'CREATE INDEX `idx_sets_workout` ON `sets` (`workout`)',
        'CREATE INDEX `idx_sets_user_exercise` ON `sets` (`user`, `exercise`)',
      ],
    })
    app.save(sets)
  },
  (app) => {
    for (const n of ['sets', 'workouts', 'exercises']) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (e) {}
    }
  },
)
