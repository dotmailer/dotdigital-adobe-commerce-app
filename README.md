# Dotdigital Integration with Adobe App Builder

Welcome to the Dotdigital for Adobe Commerce accelerator app.

Our app provides a simple starter integration with Adobe Commerce via Adobe App Builder. It will perform single synchronizations of customers, subscribers, products and orders into Dotdigital.

## Prerequisites
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
```
COMMERCE_BASE_URL=
COMMERCE_CONSUMER_KEY=
COMMERCE_CONSUMER_SECRET=
COMMERCE_ACCESS_TOKEN=
COMMERCE_ACCESS_TOKEN_SECRET=
```
- Fill in the following Dotdigital configs (unless already configured in Exchange):
```
DOTDIGITAL_API_URL=
DOTDIGITAL_API_USER=
DOTDIGITAL_API_PASSWORD=
DOTDIGITAL_LIST_CUSTOMER=
DOTDIGITAL_LIST_SUBSCRIBER=
DOTDIGITAL_CATALOG_COLLECTION_NAME=
DOTDIGITAL_DATAFIELD_MAPPING=
```

## Dotdigital account configuration
You must ensure that any data fields you include in your `DOTDIGITAL_DATAFIELD_MAPPING` array exist in your Dotdigital account.

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
- Edit the `./onboarding/config/registrations.json` file if you don't need an event registration for a particular entity.

### Deploy
Run the following command to deploy the project; this will deploy the runtime actions needed for the onboarding step:
```
aio app deploy
```

The deployment script will automatically be followed by the starter kit processes for onboarding and event subscription:
```
npm run onboard
npm run commerce-event-subscribe
```

Read more: 
- [Starter kit onboarding](https://github.com/adobe/commerce-integration-starter-kit/blob/main/README.md#execute-the-onboarding)
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
| Product | observer.catalog_product_save_commit_after | id, entity_id, name, sku, stock_data.qty, price, status, type_id, url_key, image, created_at, parent_id, store_ids | product [create](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/products#operation/GetV1Products) / [update](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/productssku/#operation/PutV1ProductsSku) |
| Customer | observer.customer_save_commit_after | id, email | customer [create](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/customers#operation/PostV1Customers) / [update](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/customerscustomerId#operation/PutV1CustomersCustomerId) |
| Customer | observer.customer_delete_commit_after | email | customer [delete](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/customerscustomerId#operation/DeleteV1CustomersCustomerId) |
| Order | observer.sales_order_save_commit_after | entity_id, grand_total, order_currency_code, created_at, subtotal, items, customer_email, increment_id, quote_id, status, addresses, store_name, discount_amount, payment, shipping_description, shipping_amount, coupon_code | order [create](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderscreate#operation/PutV1OrdersCreate) / [invoice](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderorderIdinvoice#operation/PostV1OrderOrderIdInvoice) / [ship](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderorderIdship/) / [refund](https://adobe-commerce.redoc.ly/2.4.7-admin/tag/orderorderIdrefund#operation/PostV1OrderOrderIdRefund) (and others) |
| Subscriber | observer.newsletter_subscriber_save_after  | subscriber_id, subscriber_email, subscriber_status |            |


