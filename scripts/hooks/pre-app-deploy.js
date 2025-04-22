module.exports = (context) => {
  const events = context.events
  const packages = context.manifest.full.packages
  const deployWebhookActions = process.env.DEPLOY_WEBHOOK_ACTIONS

  if (!deployWebhookActions) {
    return
  }
  try {
    console.log('Pre App Deploy - actions setting web: \'yes\'')
    for (const key in packages) {
      if (Object.prototype.hasOwnProperty.call(packages, key)) {
        if (key === 'starter-kit') {
          continue
        }
        const actionPackage = packages[key]
        actionPackage.actions.consumer.web = 'yes'
      }
    }

    console.log('Pre App Deploy - actions registration setting runtime_action: \'__secured_consumer\'')
    for (const key in events.registrations) {
      if (Object.prototype.hasOwnProperty.call(events.registrations, key)) {
        const registration = events.registrations[key]
        registration.runtime_action = registration.runtime_action.replace('consumer', '__secured_consumer')
      }
    }
  } catch (error) {
    console.log('Pre App Deploy hook error', error)
  }
}
