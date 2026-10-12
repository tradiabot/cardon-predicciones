package com.cardonpredicciones.app;

import android.app.job.JobParameters;
import android.app.job.JobService;

/** Tarea periódica de JobScheduler: revisa los avisos en un hilo aparte (sin red en el hilo principal). */
public class AvisosJobService extends JobService {
    @Override public boolean onStartJob(final JobParameters params) {
        new Thread(() -> {
            Avisos.revisar(getApplicationContext());
            jobFinished(params, false);
        }).start();
        return true;
    }

    @Override public boolean onStopJob(JobParameters params) {
        return true;
    }
}
