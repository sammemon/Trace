package com.muet.trace;

import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class PushService extends android.app.Service {
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Handle notification actions
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public android.os.IBinder onBind(Intent intent) {
        return null;
    }

    private void showNotification(String title, String body) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "trace_notifications")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);
        NotificationManagerCompat.from(this).notify(1, builder.build());
    }
}
