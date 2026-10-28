migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const exercises = app.findCollectionByNameOrId('exercises')
    const own = '@request.auth.id != "" && user = @request.auth.id'

    const activityTypes = new Collection({
      type: 'base',
      name: 'activity_types',
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
        { type: 'text', name: 'name', required: true, max: 80 },
        { type: 'text', name: 'icon', max: 16 },
      ],
      indexes: ['CREATE INDEX `idx_activity_types_user` ON `activity_types` (`user`)'],
    })
    app.save(activityTypes)

    const trainingPlans = new Collection({
      type: 'base',
      name: 'training_plans',
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
        { type: 'text', name: 'note', max: 200 },
      ],
      indexes: ['CREATE INDEX `idx_training_plans_user` ON `training_plans` (`user`)'],
    })
    app.save(trainingPlans)

    const planExercises = new Collection({
      type: 'base',
      name: 'plan_exercises',
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
          name: 'plan',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: trainingPlans.id,
        },
        {
          type: 'relation',
          name: 'exercise',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
          collectionId: exercises.id,
        },
        { type: 'number', name: 'position' },
      ],
      indexes: [
        'CREATE INDEX `idx_plan_exercises_plan` ON `plan_exercises` (`plan`)',
        'CREATE INDEX `idx_plan_exercises_user` ON `plan_exercises` (`user`)',
      ],
    })
    app.save(planExercises)

    const workouts = app.findCollectionByNameOrId('workouts')
    workouts.fields.add(
      new Field({
        type: 'relation',
        name: 'training_plan',
        required: false,
        cascadeDelete: false,
        maxSelect: 1,
        collectionId: trainingPlans.id,
      }),
    )
    app.save(workouts)
  },
  (app) => {
    const workouts = app.findCollectionByNameOrId('workouts')
    const field = workouts.fields.getByName('training_plan')
    if (field) {
      workouts.fields.removeById(field.id)
      app.save(workouts)
    }
    for (const n of ['plan_exercises', 'training_plans', 'activity_types']) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (e) {}
    }
  },
)
