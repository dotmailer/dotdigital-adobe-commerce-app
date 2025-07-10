# Dotdigital Integration with Adobe App Builder

Welcome to the Dotdigital for Adobe Commerce accelerator app.

Our app provides a simple starter integration with Adobe Commerce via Adobe App Builder. It will perform single synchronizations of customers, subscribers, products and orders into [Dotdigital](https://dotdigital.com).

## Description

### Customer sync
- New and updated customers are sent to Dotdigital, and added to the specified customer list.
- Customers will be created with a subset of data fields, including email, first name, last name, and customer group.
- Historical sync is not yet supported.

### Subscriber sync
- New and updated newsletter subscribers are sent to Dotdigital, and added to the specified subscriber list.
- Subscribers will be created with data fields for store name, website name and subscriber status.
- Historical sync is not yet supported.
- Newsletter subscribers are not supported in Adobe Commerce SaaS.

### Order sync
- New and updated orders are sent to Dotdigital as contact insight data.
- Order data will include all required fields including prices, addresses, items, and other order details.
- Historical sync is not yet supported.

### Product sync
- New and updated products are sent to Dotdigital, and added to the specified catalog insight data collection.
- Historical sync is not yet supported.

## Prerequisites
You will need a Dotdigital account. General support and usage for the Dotdigital platform is available in the [Dotdigital Help Centre](https://support.dotdigital.com/en/).

Merchants should be familiar with Adobe’s [Commerce Integration Starter Kit](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md#prerequisites) and their [public documentation](https://developer.adobe.com/commerce/extensibility/starter-kit/integration/) for this project. You will need to:

- [Create an App Builder project](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md#create-app-builder-project) in the Adobe developer console
- [Configure a new integration in Commerce](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md#configure-a-new-integration-in-commerce)

You may also need to:
- [Install or update additional modules in Commerce](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md#install-commerce-eventing-module-only-required-when-running-adobe-commerce-versions-244-or-245)

## Acquire the app
- Acquire the app from Adobe Exchange
- Enter initial configuration for Adobe Commerce and Dotdigital
- Download the code

## Configuration
- Download and unzip the project
- Copy the env file `cp env.dist .env`
- Fill in all required OAuth, module and workspace configs as per the comments
- Fill in the following Adobe Commerce configs (unless already configured in Exchange):

```COMMERCE_BASE_URL=```

### Authentication
You can configure a Commerce Integration with:
```
COMMERCE_CONSUMER_KEY=
COMMERCE_CONSUMER_SECRET=
COMMERCE_ACCESS_TOKEN=
COMMERCE_ACCESS_TOKEN_SECRET=
```
Or an Adobe Identity Management Integration (IMS) with:
```OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRETS=[""]
OAUTH_TECHNICAL_ACCOUNT_ID=
OAUTH_TECHNICAL_ACCOUNT_EMAIL=
OAUTH_SCOPES=[""]
OAUTH_IMS_ORG_ID=
```
For IMS, don't forget to create an admin user in Adobe Commerce with the email of the technical account user from your workspace's OAuth Server-to-Server configuration.
- [Read more](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/connect/#authentication)

### Event Provider configuration
Update your provider label in events.config.yaml to match your target project, for example:
```
Commerce events provider - 3527417-dotdigital-stage
```

## Dotdigital account configuration
- Fill in the following Dotdigital configs (unless already configured in Exchange):
```
DOTDIGITAL_API_URL=
DOTDIGITAL_API_USER=
DOTDIGITAL_API_PASSWORD=
DOTDIGITAL_LIST_CUSTOMER=
DOTDIGITAL_LIST_SUBSCRIBER=
DOTDIGITAL_CATALOG_COLLECTION_NAME=
DOTDIGITAL_CATALOG_BASE_LINK_URL=
DOTDIGITAL_CATALOG_BASE_MEDIA_URL=
DOTDIGITAL_DATAFIELD_MAPPING=
```

You must ensure that any data fields you include in your `DOTDIGITAL_DATAFIELD_MAPPING` array exist in your Dotdigital account. 

Please refer back to the Dotdigital documentation for more information:
- [Create an API user](https://support.dotdigital.com/en/articles/8199489-create-an-api-user)
- [Create a contact list](https://support.dotdigital.com/en/articles/8198769-create-a-contact-list)
- [Create, delete, and edit custom data fields](https://support.dotdigital.com/en/collections/5610000-data-fields-and-marketing-preferences)

## Deployment
Following the next steps, you will deploy and onboard the starter kit for the first time. The onboarding process sets up event providers and registrations based on your selection.

### Configure the project
Install the npm dependencies using the command:
```
npm install
```

This step will connect your starter kit project to the App builder project you created earlier. Ensure to select the proper Organization > Project > Workspace with the following commands:
```
aio login
aio console org select
aio console project select
aio console workspace select
```

Sync your local application with the App Builder project using the following command:
```
aio app use
# Choose the option 'm' (merge) 
```

### Select which components to use
- Edit the file `app.config.yaml` if you only want to deploy specific entities.
- Edit the `events.config.yaml` file if you don't need an event registration for a particular entity.

### Onboarding and event subscription

Run these configuration scripts for onboarding and event subscription before deploying:
```
npm run configure-events
npm run configure-commerce-events
```

### Deploy

Run the following command to deploy the project; this will deploy the runtime actions needed for the onboarding step:
```
aio app deploy
```
To deploy your actions as webhook actions with `web:yes` - use `DEPLOY_WEBHOOK_ACTIONS=1` in your .env file.

Read more:
- [Starter kit onboarding](https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/)
- [Starter kit IMS configuration] (https://developer.adobe.com/commerce/extensibility/starter-kit/checkout/connect/)
- [Subscribing to events in Adobe Commerce](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md#subscribe-to-events-in-adobe-commerce-instance)

## Verify
You can confirm the success of the deployment in the Adobe Developer Console by navigating to the **Runtime** section on your workspace:
<img width="1404" alt="Screenshot 2025-03-06 at 10 45 45" src="https://github.com/user-attachments/assets/31de1991-0d61-4930-8d66-4dee256eb8f1" />

Check your App developer console to confirm the creation of the registrations:
<img width="1405" alt="Screenshot 2025-03-06 at 10 46 45" src="https://github.com/user-attachments/assets/3cd2b34a-da12-46db-a5ff-add648921e8d" />

In the Adobe Commerce Admin, check the values populated in Stores > Settings > Configuration > Adobe Services > Adobe I/O Events > General configuration:
![OovdfV9g](https://github.com/user-attachments/assets/22790daf-bda9-43ab-b0af-ef83abcf50b0)

## Events
Here are the events with the minimal required fields you need to subscribe to, it includes the REST API endpoints that could trigger these events:
| Entity  | Event | Required fields | REST API Ref |
| ---- | ---- | ---- | ---- |
| Product | observer.catalog_product_save_commit_after | id, entity_id, name, sku, stock_data.qty, price, status, type_id, url_key, image, created_at, parent_id, store_ids | product [create](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/products#operation/PostV1Products) / [update](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/productssku/#operation/PutV1ProductsSku) |
| Customer | observer.customer_save_commit_after | id, email | customer [create](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/customers#operation/PostV1Customers) / [update](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/customerscustomerId#operation/PutV1CustomersCustomerId) |
| Order | observer.sales_order_save_commit_after | entity_id, grand_total, order_currency_code, created_at, subtotal, items, customer_email, increment_id, quote_id, status, addresses, store_name, discount_amount, payment, shipping_description, shipping_amount, coupon_code | order [create](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderscreate#operation/PutV1OrdersCreate) / [invoice](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderorderIdinvoice#operation/PostV1OrderOrderIdInvoice) / [ship](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderorderIdship/) / [refund](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderorderIdrefund#operation/PostV1OrderOrderIdRefund) (and others) |
| Subscriber | observer.newsletter_subscriber_save_after  | subscriber_id, subscriber_email, subscriber_status |            |


